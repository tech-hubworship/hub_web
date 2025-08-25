import React, { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import AdminLayout from '@src/components/AdminLayout';
import { 
  getTshirtOrders, 
  updateOrderStatus, 
  searchOrdersByName, 
  searchOrdersByPhone, 
  OrderItem, 
  getOrderDetails,
  getOrderItems,
  OrderItemDetail
} from '@src/lib/api/admin';
import Head from 'next/head';
import * as XLSX from 'xlsx';
import { message } from 'antd';

// 엑셀 데이터 인터페이스
interface ExcelData {
  거래일시: string;
  내용: string;
  거래금액: number;
  거래구분: string;
  메모?: string;
}

export default function TshirtOrderManagementPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'phone'>('name');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPaymentCheckMode, setIsPaymentCheckMode] = useState(false);
  const [originalStatuses, setOriginalStatuses] = useState<Record<number, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  // 엑셀 파일 관련 상태 추가
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [filteredExcelData, setFilteredExcelData] = useState<ExcelData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 매칭된 주문과 입금 내역을 저장할 상태 추가
  const [matchedOrders, setMatchedOrders] = useState<Record<number, number>>({});
  
  // 주문 상세 팝업 관련 상태
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderItem | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([]);
  
  // 주문 목록 불러오기
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getTshirtOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('주문 목록 로드 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  // 필터링 적용
  useEffect(() => {
    if (isPaymentCheckMode) {
      // 입금확인 모드일 때는 미입금과 입금확인중 상태만 표시
      const relevantOrders = orders.filter(order => 
        order.status === '미입금' || order.status === '입금확인중'
      );
      setFilteredOrders(relevantOrders);
    } else if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, orders, isPaymentCheckMode]);
  
  // 입금확인 모드 토글
  const togglePaymentCheckMode = () => {
    const newMode = !isPaymentCheckMode;
    setIsPaymentCheckMode(newMode);
    
    // 입금확인 모드 진입 시 필터링 재적용
    if (newMode) {
      // 원래 상태 저장
      const statuses: Record<number, string> = {};
      orders.forEach(order => {
        statuses[order.order_id] = order.status;
      });
      setOriginalStatuses(statuses);
      
      // 필터 초기화 및 임시 변경사항 초기화
      setStatusFilter('all');
      setPendingChanges({});
    }
  };
  
  // 주문 상태 변경
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setSelectedOrderId(orderId);
    setUpdateLoading(true);
    
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        // 상태 업데이트 후 목록 새로고침
        const updatedOrders = orders.map(order => 
          order.order_id === orderId ? { ...order, status: newStatus } : order
        );
        setOrders(updatedOrders);
        
        // 필터링 다시 적용
        if (isPaymentCheckMode) {
          setFilteredOrders(updatedOrders.filter(order => 
            order.status === '미입금' || order.status === '입금확인중'
          ));
        } else if (statusFilter === 'all' || statusFilter === newStatus) {
          setFilteredOrders(
            statusFilter === 'all' 
              ? updatedOrders 
              : updatedOrders.filter(order => order.status === statusFilter)
          );
        } else {
          setFilteredOrders(prev => prev.filter(order => order.order_id !== orderId));
        }
      } else {
        alert('주문 상태 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 상태 업데이트 중 오류:', error);
      alert('주문 상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdateLoading(false);
      setSelectedOrderId(null);
    }
  };
  
  // 입금확인 모드에서 상태 변경 (임시 저장)
  const handlePendingStatusChange = (orderId: number) => {
    if (!isPaymentCheckMode) return;
    
    // 이미 '입금완료'로 표시된 항목은 원래 상태로 돌리고, 그렇지 않으면 '입금완료'로 표시
    const newPendingChanges = { ...pendingChanges };
    
    if (pendingChanges[orderId] === '입금완료') {
      delete newPendingChanges[orderId]; // 선택 취소
    } else {
      newPendingChanges[orderId] = '입금완료'; // 입금완료로 표시
    }
    
    setPendingChanges(newPendingChanges);
  };
  
  // 임시 저장된 모든 변경사항 적용
  const saveAllChanges = async () => {
    if (!isPaymentCheckMode || Object.keys(pendingChanges).length === 0) return;
    
    setIsSaving(true);
    
    try {
      // 변경사항 순차적으로 적용
      for (const [orderId, newStatus] of Object.entries(pendingChanges)) {
        await updateOrderStatus(parseInt(orderId), newStatus);
      }
      
      // 성공적으로 저장 완료 후 주문 목록 새로고침
      await loadOrders();
      
      // 임시 변경사항 초기화
      setPendingChanges({});
      
      alert('모든 변경사항이 저장되었습니다.');
    } catch (error) {
      console.error('변경사항 저장 중 오류:', error);
      alert('변경사항 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 검색 처리
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadOrders();
      return;
    }
    
    setLoading(true);
    try {
      let results: OrderItem[] = [];
      if (searchType === 'name') {
        results = await searchOrdersByName(searchTerm);
      } else {
        results = await searchOrdersByPhone(searchTerm);
      }
      setOrders(results);
      
      // 필터링 적용
      if (isPaymentCheckMode) {
        setFilteredOrders(results.filter(order => 
          order.status === '미입금' || order.status === '입금확인중'
        ));
      } else if (statusFilter === 'all') {
        setFilteredOrders(results);
      } else {
        setFilteredOrders(results.filter(order => order.status === statusFilter));
      }
    } catch (error) {
      console.error('검색 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 상태별 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '미입금':
        return '#ef4444'; // 빨간색 (미입금)
      case '입금확인중':
        return '#f97316'; // 주황색 (입금확인중)
      case '입금완료':
        return '#10b981'; // 초록색 (입금완료)
      case '주문확정':
        return '#3b82f6'; // 파란색 (주문확정)
      case '수령완료':
        return '#8b5cf6'; // 보라색 (수령완료)
      case '취소됨':
        return '#6b7280'; // 회색 (취소됨)
      default:
        return '#6b7280'; // 회색
    }
  };
  
  // DB 저장 시 사용할 영문 상태값 변환
  const getStatusValue = (statusText: string) => {
    switch (statusText) {
      case '미입금':
        return '미입금';
      case '입금확인중':
        return '입금확인중';
      case '입금완료':
        return '입금완료';
      case '주문확정':
        return '주문확정';
      case '취소됨':
        return '취소됨';
      default:
        return statusText;
    }
  };
  
  // 선택된 상품 수 계산
  const selectedCount = Object.keys(pendingChanges).length;
  
  // 엑셀 파일 업로드 처리
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelData>(worksheet);
        
        // 엑셀 데이터 저장
        setExcelData(jsonData);
        
        // '일반입금'인 항목만 필터링
        const generalDepositOnly = jsonData.filter(item => item.거래구분 === '일반입금');
        setFilteredExcelData(generalDepositOnly);
        
        // 데이터 매칭 처리
        matchOrdersWithDeposits(generalDepositOnly, filteredOrders);
      } catch (error) {
        console.error('엑셀 파일 처리 중 오류:', error);
        alert('엑셀 파일 처리 중 오류가 발생했습니다.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // 주문과 입금 데이터 매칭
  const matchOrdersWithDeposits = (deposits: ExcelData[], orders: OrderItem[]) => {
    const matches: Record<number, number> = {};
    
    deposits.forEach((deposit, depositIndex) => {
      orders.forEach(order => {
        // 금액이 같고 입금자명(내용)에 주문자 이름이 포함되어 있는지 확인
        if (
          deposit.거래금액 === order.total_price && 
          deposit.내용.includes(order.name)
        ) {
          matches[order.order_id] = depositIndex;
        }
      });
    });
    
    setMatchedOrders(matches);
    
    // 매칭된 주문 자동 체크 (선택 사항)
    const newPendingChanges = { ...pendingChanges };
    Object.keys(matches).forEach(orderId => {
      newPendingChanges[parseInt(orderId)] = '입금완료';
    });
    setPendingChanges(newPendingChanges);
  };

  // 주문과 입금 내역이 매칭되었는지 확인
  const isOrderMatched = (orderId: number) => {
    return matchedOrders[orderId] !== undefined;
  };

  // 매칭된 입금 내역 강조 표시
  const isDepositMatched = (index: number) => {
    return Object.values(matchedOrders).includes(index);
  };

  // 파일 업로드 버튼 클릭 핸들러
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // 엑셀 데이터 정렬 함수 추가
  const getSortedExcelData = () => {
    if (filteredExcelData.length === 0) return [];
    
    // 매칭된 항목과 매칭되지 않은 항목으로 분리
    const matched: ExcelData[] = [];
    const unmatched: ExcelData[] = [];
    
    filteredExcelData.forEach((item, index) => {
      if (isDepositMatched(index)) {
        matched.push(item);
      } else {
        unmatched.push(item);
      }
    });
    
    // 매칭되지 않은 항목은 거래일시 기준으로 오름차순 정렬
    unmatched.sort((a, b) => {
      const dateA = new Date(a.거래일시).getTime();
      const dateB = new Date(b.거래일시).getTime();
      return dateA - dateB; // 오름차순 정렬
    });
    
    // 매칭된 항목 먼저, 그 다음 정렬된 매칭되지 않은 항목
    return [...matched, ...unmatched];
  };

  // 주문 데이터 정렬 함수 추가
  const getSortedOrderData = () => {
    if (filteredOrders.length === 0) return [];
    
    // 매칭된 항목과 매칭되지 않은 항목으로 분리
    const matched: OrderItem[] = [];
    const unmatched: OrderItem[] = [];
    
    filteredOrders.forEach(order => {
      if (isOrderMatched(order.order_id)) {
        matched.push(order);
      } else {
        unmatched.push(order);
      }
    });
    
    // 매칭된 항목 먼저, 그 다음 매칭되지 않은 항목
    return [...matched, ...unmatched];
  };
  
  // 주문 상세 정보 조회
  const handleViewOrderDetail = async (orderId: number) => {
    setSelectedOrderId(orderId);
    
    try {
      // 주문 기본 정보 조회
      const orderDetail = await getOrderDetails(orderId);
      if (!orderDetail) {
        alert('주문 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 주문 아이템 조회
      const items = await getOrderItems(orderId);
      
      setSelectedOrderDetails(orderDetail);
      setOrderItems(items);
      setShowOrderDetail(true);
    } catch (error) {
      console.error('주문 상세 정보 조회 중 오류:', error);
      alert('주문 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setSelectedOrderId(null);
    }
  };
  
  // 주문 상세 팝업 닫기
  const closeOrderDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrderDetails(null);
    setOrderItems([]);
  };
  
  // 총 수량 계산 함수
  const getTotalQuantity = (items: OrderItemDetail[]): number => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  // 옵션별 수량을 문자열로 표시
  const formatOptionQuantity = (items: OrderItemDetail[]): string => {
    const optionCounts: Record<string, number> = {};
    
    items.forEach(item => {
      const key = `${item.color} / ${item.size}`;
      optionCounts[key] = (optionCounts[key] || 0) + item.quantity;
    });
    
    return Object.entries(optionCounts)
      .map(([option, count]) => `${option}: ${count}개`)
      .join(', ');
  };
  
  // 사이즈 업데이트 함수 추가
  const updateTshirtSize = async (orderId: number, color: string, oldSize: string, newSize: string, itemId: number) => {
    try {
      const response = await fetch(`/api/admin/tshirt/update-size`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, color, oldSize, newSize, itemId })
      });
      
      if (response.ok) {
        const result = await response.json();
        message.success(`사이즈가 성공적으로 변경되었습니다 (${result.updateCount}건 업데이트)`);
        // 주문 아이템 새로고침
        const updatedItems = await getOrderItems(orderId);
        setOrderItems(updatedItems);
      } else {
        message.error('사이즈 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('사이즈 변경 중 오류 발생:', error);
      message.error('사이즈 변경 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <>
      <Head>
        <title>티셔츠 주문 관리 | 허브 커뮤니티</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AdminLayout title="티셔츠 주문 관리">
        <SearchSection>
          <SearchContainer>
            <SearchTypeSelect 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value as 'name' | 'phone')}
              disabled={isPaymentCheckMode}
            >
              <option value="name">이름</option>
              <option value="phone">전화번호</option>
            </SearchTypeSelect>
            <SearchInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchType === 'name' ? '이름 검색...' : '전화번호 검색...'}
              disabled={isPaymentCheckMode}
            />
            <SearchButton onClick={handleSearch} disabled={isPaymentCheckMode}>검색</SearchButton>
          </SearchContainer>
          <FilterContainer>
            <PaymentCheckModeButton 
              onClick={togglePaymentCheckMode}
              isActive={isPaymentCheckMode}
              disabled={isSaving}
            >
              {isPaymentCheckMode ? '일반 모드' : '입금확인 모드'}
            </PaymentCheckModeButton>
            
            {!isPaymentCheckMode && (
              <>
                <FilterLabel>상태 필터:</FilterLabel>
                <FilterSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">전체</option>
                  <option value="미입금">미입금</option>
                  <option value="입금확인중">입금확인중</option>
                  <option value="입금완료">입금완료</option>
                  <option value="주문확정">주문확정</option>
                  <option value="수령완료">수령완료</option>
                  <option value="취소됨">취소됨</option>
                </FilterSelect>
              </>
            )}
            <RefreshButton onClick={loadOrders} disabled={isSaving}>새로고침</RefreshButton>
          </FilterContainer>
        </SearchSection>
        
        {isPaymentCheckMode && (
          <>
            <PaymentCheckModeGuide>
              입금확인 모드: 주문자 이름 오른쪽의 체크박스를 선택하여 입금완료 처리할 주문을 선택한 후, 하단의 저장 버튼을 클릭하면 한 번에 처리됩니다.
            </PaymentCheckModeGuide>
            
            <SaveChangesBar>
              <SelectedCount>
                {selectedCount > 0 ? `${selectedCount}개 선택됨` : '선택된 항목 없음'}
              </SelectedCount>
              <SaveButton 
                onClick={saveAllChanges} 
                disabled={selectedCount === 0 || isSaving}
              >
                {isSaving ? '저장 중...' : '입금완료 처리하기'}
              </SaveButton>
            </SaveChangesBar>
            
            <ExcelUploadSection>
              <ExcelUploadLabel>
                은행 거래내역 엑셀 파일 업로드:
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <ExcelUploadButton onClick={handleUploadButtonClick}>
                  파일 선택
                </ExcelUploadButton>
              </ExcelUploadLabel>
              {filteredExcelData.length > 0 && (
                <ExcelUploadInfo>
                  {filteredExcelData.length}개의 '일반입금' 데이터가 로드되었습니다.
                </ExcelUploadInfo>
              )}
            </ExcelUploadSection>
          </>
        )}
        
        {loading ? (
          <LoadingMessage>주문 정보를 불러오는 중...</LoadingMessage>
        ) : filteredOrders.length === 0 ? (
          <NoOrdersMessage>주문 내역이 없습니다.</NoOrdersMessage>
        ) : (
          <ContentLayout isPaymentCheckMode={isPaymentCheckMode}>
            <TableContainer isPaymentCheckMode={isPaymentCheckMode}>
              <Table>
                <thead>
                  <tr>
                    {isPaymentCheckMode && (
                      <TableHeader width="60px" align="center">선택</TableHeader>
                    )}
                    <TableHeader>주문번호</TableHeader>
                    <TableHeader>주문자</TableHeader>
                    <TableHeader>전화번호</TableHeader>
                    <TableHeader>주문일자</TableHeader>
                    <TableHeader>금액</TableHeader>
                    <TableHeader>상태</TableHeader>
                    {!isPaymentCheckMode && <TableHeader>관리</TableHeader>}
                  </tr>
                </thead>
                <TableBody>
                  {getSortedOrderData().map((order) => (
                    <TableRow 
                      key={order.order_id}
                      isProcessing={updateLoading && selectedOrderId === order.order_id}
                      isSelected={pendingChanges[order.order_id] === '입금완료'}
                      isMatched={isPaymentCheckMode && isOrderMatched(order.order_id)}
                      onClick={() => !isPaymentCheckMode && handleViewOrderDetail(order.order_id)}
                      style={{ cursor: isPaymentCheckMode ? 'default' : 'pointer' }}
                    >
                      {isPaymentCheckMode && (
                        <TableCell align="center">
                          <Checkbox
                            type="checkbox"
                            checked={pendingChanges[order.order_id] === '입금완료'}
                            onChange={() => handlePendingStatusChange(order.order_id)}
                            disabled={isSaving}
                          />
                        </TableCell>
                      )}
                      <TableCell>{order.order_id}</TableCell>
                      <TableCell>
                        {order.name}
                        {isPaymentCheckMode && isOrderMatched(order.order_id) && (
                          <MatchedBadge>매칭됨</MatchedBadge>
                        )}
                      </TableCell>
                      <TableCell>{order.user_phone}</TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString()} {new Date(order.order_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </TableCell>
                      <TableCell>{order.total_price.toLocaleString()}원</TableCell>
                      <TableCell>
                        <StatusBadge color={getStatusColor(order.status)}>
                          {order.status}
                        </StatusBadge>
                      </TableCell>
                      {!isPaymentCheckMode && (
                        <TableCell>
                          <ActionContainer>
                            <StatusSelect
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              disabled={updateLoading && selectedOrderId === order.order_id}
                              statusColor={getStatusColor(order.status)}
                            >
                              <option value="미입금">미입금</option>
                              <option value="입금확인중">입금확인중</option>
                              <option value="입금완료">입금완료</option>
                              <option value="주문확정">주문확정</option>
                              <option value="수령완료">수령완료</option>
                              <option value="취소됨">취소됨</option>
                            </StatusSelect>
                          </ActionContainer>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {isPaymentCheckMode && filteredExcelData.length > 0 && (
              <ExcelDataTableContainer>
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>내용</TableHeader>
                      <TableHeader>거래금액</TableHeader>
                      <TableHeader>거래일시</TableHeader>
                    </tr>
                  </thead>
                  <TableBody>
                    {getSortedExcelData().map((item, index) => (
                      <TableRow 
                        key={index}
                        isMatched={Object.values(matchedOrders).includes(filteredExcelData.indexOf(item))}
                      >
                        <TableCell>
                          {item.내용}
                          {Object.values(matchedOrders).includes(filteredExcelData.indexOf(item)) && (
                            <MatchedBadge>매칭됨</MatchedBadge>
                          )}
                        </TableCell>
                        <TableCell>{item.거래금액.toLocaleString()}원</TableCell>
                        <TableCell>{item.거래일시}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ExcelDataTableContainer>
            )}
          </ContentLayout>
        )}
      </AdminLayout>
      
      {/* 주문 상세 정보 팝업 */}
      {showOrderDetail && selectedOrderDetails && (
        <PopupOverlay onClick={closeOrderDetail}>
          <PopupContent onClick={e => e.stopPropagation()}>
            <PopupHeader>
              <PopupTitle>주문 상세 정보 (#{selectedOrderDetails.order_id})</PopupTitle>
              <CloseButton onClick={closeOrderDetail}>×</CloseButton>
            </PopupHeader>
            
            <PopupBody>
              <DetailSection>
                <DetailTitle>주문자 정보</DetailTitle>
                <DetailRow>
                  <DetailLabel>이름:</DetailLabel>
                  <DetailValue>{selectedOrderDetails.name}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>전화번호:</DetailLabel>
                  <DetailValue>{selectedOrderDetails.user_phone}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>주문일시:</DetailLabel>
                  <DetailValue>
                    {new Date(selectedOrderDetails.order_date).toLocaleDateString()} {new Date(selectedOrderDetails.order_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>상태:</DetailLabel>
                  <DetailValue>
                    <StatusBadge color={getStatusColor(selectedOrderDetails.status)}>
                      {selectedOrderDetails.status}
                    </StatusBadge>
                  </DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>총 금액:</DetailLabel>
                  <DetailValue>₩{selectedOrderDetails.total_price.toLocaleString()}</DetailValue>
                </DetailRow>
              </DetailSection>
              
              <DetailSection>
                <DetailTitle>주문 항목</DetailTitle>
                {orderItems.length === 0 ? (
                  <EmptyMessage>주문 항목이 없습니다.</EmptyMessage>
                ) : (
                  <>
                    <OrderItemsTable>
                      <thead>
                        <tr>
                          <ItemTableHeader>항목 ID</ItemTableHeader>
                          <ItemTableHeader>사이즈</ItemTableHeader>
                          <ItemTableHeader>색상</ItemTableHeader>
                          <ItemTableHeader>수량</ItemTableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map(item => (
                          <tr key={item.item_id}>
                            <ItemTableCell>{item.item_id}</ItemTableCell>
                            <ItemTableCell>
                              <SizeSelect 
                                defaultValue={item.size} 
                                onChange={(e) => updateTshirtSize(
                                  selectedOrderDetails.order_id, 
                                  item.color, 
                                  item.size, 
                                  e.target.value,
                                  item.item_id
                                )}
                              >
                                <option value="XS">XS</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="2XL">2XL</option>
                                <option value="3XL">3XL</option>
                                <option value="4XL">4XL</option>
                                <option value="5XL">5XL</option>
                              </SizeSelect>
                            </ItemTableCell>
                            <ItemTableCell>{item.color}</ItemTableCell>
                            <ItemTableCell>{item.quantity}</ItemTableCell>
                          </tr>
                        ))}
                      </tbody>
                    </OrderItemsTable>
                    <OrderSummary>
                      <SummaryText>총 수량: {getTotalQuantity(orderItems)}개</SummaryText>
                    </OrderSummary>
                  </>
                )}
              </DetailSection>
            </PopupBody>
          </PopupContent>
        </PopupOverlay>
      )}
    </>
  );
}

// 스타일 컴포넌트
const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: 14px;
  color: #4b5563;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const SearchTypeSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 100px;
  
  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #000;
  }
  
  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const SearchButton = styled.button`
  padding: 8px 16px;
  background-color: #000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #222;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const SaveChangesBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const SelectedCount = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #059669;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const PaymentCheckModeButton = styled.button<{ isActive: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.isActive ? '#10b981' : '#3b82f6'};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.isActive ? '#059669' : '#2563eb'};
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const PaymentCheckModeGuide = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 4px;
  color: #047857;
  font-size: 14px;
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #374151;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-weight: 500;
`;

const NoOrdersMessage = styled.div`
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-weight: 500;
`;

const TableContainer = styled.div<{ isPaymentCheckMode?: boolean }>`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
  width: 100%;
  
  @media (min-width: 1200px) {
    width: ${props => props.isPaymentCheckMode ? '60%' : '100%'};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: #f9fafb;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ isProcessing?: boolean; isSelected?: boolean; isMatched?: boolean }>`
  border-bottom: 1px solid #e5e7eb;
  background-color: ${props => {
    if (props.isMatched) return '#e0f2fe'; // 매칭된 경우 연한 파란색
    if (props.isSelected) return '#ecfdf5'; // 선택된 경우 연한 초록색
    return 'white';
  }};
  height: 60px; // 행 높이 통일
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.isProcessing && `
    opacity: 0.7;
    pointer-events: none;
  `}
`;

const TableHeader = styled.th<{ width?: string; align?: string }>`
  padding: 12px 16px;
  text-align: ${props => props.align || 'left'};
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  width: ${props => props.width || 'auto'};
`;

const TableCell = styled.td<{ align?: string }>`
  padding: 12px 16px;
  color: #1f2937;
  font-size: 14px;
  text-align: ${props => props.align || 'left'};
  vertical-align: middle; // 셀 내용 세로 가운데 정렬
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props => props.color};
  color: white;
  font-size: 12px;
  font-weight: 500;
`;

const ActionContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ color: string }>`
  padding: 6px 10px;
  background-color: ${props => props.color};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const StatusSelect = styled.select<{ statusColor: string }>`
  padding: 6px 10px;
  background-color: ${props => props.statusColor};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  width: 110px;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    background-color: #9ca3af;
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  option {
    background-color: white;
    color: #000;
  }
`;

const ContentLayout = styled.div<{ isPaymentCheckMode: boolean }>`
  display: flex;
  gap: 24px;
  flex-direction: column;
  
  @media (min-width: 1200px) {
    flex-direction: ${props => props.isPaymentCheckMode ? 'row' : 'column'};
    align-items: flex-start;
  }
`;

const ExcelUploadSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
`;

const ExcelUploadLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #374151;
`;

const ExcelUploadButton = styled.button`
  padding: 6px 12px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: #4f46e5;
  }
`;

const ExcelUploadInfo = styled.span`
  font-size: 14px;
  color: #059669;
  font-weight: 500;
`;

const ExcelDataTableContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
  flex: 1;
  
  @media (min-width: 1200px) {
    max-width: 40%;
  }
`;

const ExcelDataTitle = styled.h3`
  padding: 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const MatchedBadge = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PopupContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PopupTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  padding: 8px 16px;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #374151;
  }
`;

const PopupBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DetailTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 8px;
`;

const DetailLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: #1f2937;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-weight: 500;
`;

const OrderItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const ItemTableHeader = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
`;

const ItemTableCell = styled.td`
  padding: 12px 16px;
  color: #1f2937;
  font-size: 14px;
  text-align: left;
`;

const OrderSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const SummaryText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const StatsPopupContent = styled.div`
  display: none; /* 대시보드 팝업 숨김 */
`;

const StatsBody = styled.div`
  display: none; /* 대시보드 내용 숨김 */
`;

const StatsTable = styled.table`
  display: none; /* 대시보드 테이블 숨김 */
`;

const StatsHeader = styled.th<{ colorHeader?: boolean; sizeHeader?: boolean; width?: string }>`
  display: none; /* 대시보드 헤더 숨김 */
`;

const StatsRowHeader = styled.td`
  display: none; /* 대시보드 행 헤더 숨김 */
`;

const StatsCell = styled.td<{ highlighted?: boolean }>`
  display: none; /* 대시보드 셀 숨김 */
`;

// 사이즈 선택 컴포넌트 추가
const SizeSelect = styled.select`
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &:hover {
    border-color: #3b82f6;
  }
`; 