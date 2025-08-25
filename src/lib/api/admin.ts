import { supabase } from '@src/lib/supabase';

// 관리자 인증 관련 타입
export interface AdminLoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface OrderItem {
  order_id: number;
  user_phone: string;
  order_date: string;
  status: string;
  total_price: number;
  name: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

// 관리자 로그인
export const loginAdmin = async (phone: string, password: string): Promise<LoginResult> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('phone_number', phone)
      .eq('password', password)
      .single();

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }

    if (!data) {
      return { success: false, error: '전화번호 또는 비밀번호가 올바르지 않습니다.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
  }
};

// 티셔츠 주문 목록 가져오기
export async function getTshirtOrders(): Promise<OrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('티셔츠 주문 목록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('티셔츠 주문 목록 조회 중 오류:', error);
    return [];
  }
}

// 주문 상태 업데이트
export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', orderId);

    if (error) {
      console.error('주문 상태 업데이트 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('주문 상태 업데이트 중 오류:', error);
    return false;
  }
}

// QR 코드 데이터 검증 및 주문 확인
export async function verifyQRCodeAndUpdateStatus(qrData: string, newStatus: string | null = '수령완료'): Promise<{success: boolean; message: string; orderData?: any}> {
  try {
    console.log("QR 코드 데이터:", qrData);
    
    // QR 코드 데이터 파싱 처리 개선
    // 217-010-3186-0505 형식인 경우도 처리
    let orderIdStr = '';
    let phoneNumber = '';
    
    // 하이픈으로 분할
    const parts = qrData.split('-');
    
    if (parts.length >= 2) {
      orderIdStr = parts[0]; // 첫 번째 부분은 항상 주문 ID
      
      if (parts.length === 2) {
        // 217-01031860505 형식 (하이픈 없는 전화번호)
        phoneNumber = parts[1];
        
        // 전화번호에 하이픈 추가 (형식: 010-1234-5678)
        if (phoneNumber.length === 11) {
          phoneNumber = `${phoneNumber.substring(0, 3)}-${phoneNumber.substring(3, 7)}-${phoneNumber.substring(7)}`;
        }
      } else if (parts.length >= 4) {
        // 217-010-3186-0505 형식 (하이픈 포함 전화번호)
        phoneNumber = `${parts[1]}-${parts[2]}-${parts[3]}`;
      }
    }
    
    console.log(`파싱 결과 - 주문 ID: ${orderIdStr}, 전화번호: ${phoneNumber}`);
    
    if (!orderIdStr || !phoneNumber) {
      return { success: false, message: '잘못된 QR 코드 형식입니다.' };
    }
    
    const orderId = parseInt(orderIdStr);
    
    if (isNaN(orderId)) {
      return { success: false, message: '주문 번호가 올바르지 않습니다.' };
    }
    
    // 주문 정보 조회
    console.log(`DB 조회 - 주문 ID: ${orderId}, 전화번호: ${phoneNumber}`);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_phone', phoneNumber)
      .single();
      
    if (error || !data) {
      console.error('주문 조회 오류:', error);
      return { success: false, message: '해당 주문을 찾을 수 없습니다.' };
    }
    
    // 주문 상태가 '주문확정'이 아니면 오류 반환
    if (data.status !== '주문확정') {
      return { 
        success: false, 
        message: data.status === '수령완료' 
          ? '이미 수령 완료된 주문입니다.'
          : `현재 주문 상태(${data.status})에서는 수령 처리할 수 없습니다.`,
        orderData: data // 주문 정보 반환
      };
    }
    
    // newStatus가 null이면 상태 업데이트 없이 주문 정보만 반환
    if (newStatus === null) {
      return { 
        success: true, 
        message: '티셔츠 수령 준비가 완료되었습니다. 수령 확인 버튼을 클릭하세요.',
        orderData: data
      };
    }
    
    // 주문 상태 업데이트
    const updateResult = await updateOrderStatus(orderId, newStatus);
    
    if (!updateResult) {
      return { success: false, message: '주문 상태 업데이트에 실패했습니다.' };
    }
    
    // 주문 정보 반환
    return { 
      success: true, 
      message: '티셔츠 수령이 확인되었습니다.',
      orderData: {
        ...data,
        status: newStatus
      }
    };
  } catch (error) {
    console.error('QR 코드 검증 중 오류:', error);
    return { success: false, message: '처리 중 오류가 발생했습니다.' };
  }
}

// 주문 상세 정보 가져오기
export async function getOrderDetails(orderId: number): Promise<OrderItem | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('주문 상세 정보 조회 오류:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('주문 상세 정보 조회 중 오류:', error);
    return null;
  }
}

// 사용자 이름으로 주문 검색
export async function searchOrdersByName(name: string): Promise<OrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('주문 검색 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('주문 검색 중 오류:', error);
    return [];
  }
}

// 전화번호로 주문 검색
export async function searchOrdersByPhone(phone: string): Promise<OrderItem[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('user_phone', `%${phone}%`)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('전화번호 검색 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('전화번호 검색 중 오류:', error);
    return [];
  }
}

// 주문 상태별 통계 가져오기
export async function getOrderStatusStats(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status');

    if (error) {
      console.error('주문 상태 통계 조회 오류:', error);
      return { '미입금': 0, '입금확인중': 0, '입금완료': 0, '주문확정': 0, '수령완료': 0, '취소됨': 0 };
    }

    const stats: Record<string, number> = { 
      '미입금': 0, 
      '입금확인중': 0, 
      '입금완료': 0, 
      '주문확정': 0,
      '수령완료': 0,
      '취소됨': 0 
    };
    
    data.forEach((order) => {
      const status = order.status as string;
      if (stats[status] !== undefined) {
        stats[status]++;
      } else {
        stats[status] = 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('주문 상태 통계 조회 중 오류:', error);
    return { '미입금': 0, '입금확인중': 0, '입금완료': 0, '주문확정': 0, '수령완료': 0, '취소됨': 0 };
  }
}

// 주문 아이템 가져오기
export interface OrderItemDetail {
  item_id: number;
  order_id: number;
  tshirt_id: number;
  size: string;
  color: string;
  quantity: number;
}

export async function getOrderItems(orderId: number): Promise<OrderItemDetail[]> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('item_id', { ascending: true });

    if (error) {
      console.error('주문 아이템 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('주문 아이템 조회 중 오류:', error);
    return [];
  }
}

// 티셔츠 옵션별 주문 수량 통계 가져오기
export async function getTshirtOrderStats(): Promise<any> {
  try {
    // 모든 주문 아이템 가져오기
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*, orders(status)');

    if (orderItemsError) {
      console.error('주문 아이템 통계 조회 오류:', orderItemsError);
      return null;
    }

    // 티셔츠 옵션 가져오기
    const { data: tshirtOptions, error: tshirtOptionsError } = await supabase
      .from('tshirt_options')
      .select('size, color')
      .order('size', { ascending: true });

    if (tshirtOptionsError) {
      console.error('티셔츠 옵션 조회 오류:', tshirtOptionsError);
      return null;
    }

    // 기본 사이즈 옵션 추가 (4XL, 5XL이 없는 경우를 위해)
    const defaultSizes = ['4XL', '5XL'];
    const defaultColors = ['BLACK', 'WHITE'];
    
    defaultSizes.forEach(size => {
      defaultColors.forEach(color => {
        if (!tshirtOptions.some(option => option.size === size && option.color === color)) {
          tshirtOptions.push({ size, color });
        }
      });
    });

    // 옵션별로 그룹화
    const uniqueOptions = Array.from(
      new Set(tshirtOptions.map(option => `${option.size}|${option.color}`))
    ).map(combined => {
      const [size, color] = combined.split('|');
      return { size, color };
    });

    // 상태별 통계 초기화
    const stats: {
      '미입금': Record<string, number>;
      '입금확인중': Record<string, number>;
      '입금완료': Record<string, number>;
      '주문확정': Record<string, number>;
      '수령완료': Record<string, number>;
      '취소됨': Record<string, number>;
      '합계': Record<string, number>;
      [key: string]: Record<string, number>;
    } = {
      '미입금': {},
      '입금확인중': {},
      '입금완료': {},
      '주문확정': {},
      '수령완료': {},
      '취소됨': {},
      '합계': {}
    };

    // 각 옵션에 대해 초기화
    uniqueOptions.forEach(option => {
      const key = `${option.size}|${option.color}`;
      stats['미입금'][key] = 0;
      stats['입금확인중'][key] = 0;
      stats['입금완료'][key] = 0;
      stats['주문확정'][key] = 0;
      stats['수령완료'][key] = 0;
      stats['취소됨'][key] = 0;
      stats['합계'][key] = 0;
    });

    // 각 주문 아이템 처리
    orderItems.forEach(item => {
      const status = item.orders?.status || '미입금';
      const key = `${item.size}|${item.color}`;
      
      if (stats[status] && stats[status][key] !== undefined) {
        stats[status][key] += item.quantity;
        stats['합계'][key] += item.quantity;
      }
    });

    return {
      stats,
      options: uniqueOptions
    };
  } catch (error) {
    console.error('주문 통계 조회 중 오류:', error);
    return null;
  }
}

// 분실물 목록 조회
export const getLostItems = async () => {
  try {
    const { data, error } = await supabase
      .from('lost_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('분실물 목록 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('분실물 목록 조회 중 오류:', error);
    throw error;
  }
};

// 분실물 등록
export const createLostItem = async (data: {
  name: string;
  description: string;
  location: string;
  image_url?: string | null;
  contact_info?: string | null;
  found_date: string;
  status: string;
}) => {
  try {
    console.log('전송할 데이터:', data);

    const { data: newItem, error } = await supabase
      .from('lost_items')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('분실물 등록 오류:', error);
      throw error;
    }

    console.log('등록된 아이템:', newItem);
    return newItem;
  } catch (error: any) {
    console.error('분실물 등록 중 오류:', error);
    throw error;
  }
};

// 분실물 상태 업데이트
export const updateLostItemStatus = async (id: number, status: string) => {
  try {
    const { data, error } = await supabase
      .from('lost_items')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('상태 업데이트 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('분실물 상태 업데이트 중 오류:', error);
    throw error;
  }
};

// 분실물 삭제
export const deleteLostItem = async (id: number) => {
  try {
    const { error } = await supabase
      .from('lost_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('삭제 오류:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('분실물 삭제 중 오류:', error);
    throw error;
  }
};

// 분실물 정보 수정
export const updateLostItem = async (id: number, data: {
  name: string;
  description: string;
  location: string;
  image_url?: string | null;
  contact_info?: string | null;
  found_date: string;
  status: string;
}) => {
  try {
    console.log('수정할 데이터:', data);

    const { data: updatedItem, error } = await supabase
      .from('lost_items')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('분실물 수정 오류:', error);
      throw error;
    }

    console.log('수정된 아이템:', updatedItem);
    return updatedItem;
  } catch (error: any) {
    console.error('분실물 수정 중 오류:', error);
    throw error;
  }
};

// 이미지 업로드
export const uploadImage = async (file: File) => {
  try {
    console.log('이미지 업로드 시작:', file.name);
    console.log('파일 타입:', file.type);
    console.log('파일 크기:', file.size);
    
    // 파일 이름 생성 (중복 방지)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `lost-items/${fileName}`;

    console.log('업로드 경로:', filePath);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('이미지 업로드 오류:', error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    if (!data) {
      throw new Error('업로드된 파일 데이터가 없습니다.');
    }

    console.log('업로드 성공:', data);

    // 업로드된 파일의 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('이미지 URL을 생성할 수 없습니다.');
    }

    console.log('생성된 URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('이미지 업로드 중 오류:', error);
    throw new Error(error.message || '이미지 업로드에 실패했습니다.');
  }
}; 