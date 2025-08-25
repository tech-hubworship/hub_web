import { supabase } from '@src/lib/supabase';

export interface BankAccount {
  id?: number;
  bank: string;
  account: string;
  holder: string;
}

// 기본 계좌 정보 (데이터베이스 조회 실패 시 사용)
const DEFAULT_BANK_ACCOUNT: BankAccount = {
  bank: '카카오뱅크',
  account: '3333063840721',
  holder: '이지선'
};

/**
 * 데이터베이스에서 계좌 정보를 가져옵니다.
 * 실패 시 기본 계좌 정보를 반환합니다.
 */
export async function getBankAccount(): Promise<BankAccount> {
  try {
    // 가장 최근에 업데이트된 계좌 정보 조회
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('id, bank, account, holder')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    
    return data || DEFAULT_BANK_ACCOUNT;
  } catch (error) {
    console.error('계좌 정보 조회 중 오류:', error);
    return DEFAULT_BANK_ACCOUNT;
  }
}

/**
 * 계좌 정보를 캐시하여 빠르게 가져옵니다.
 * 브라우저 환경에서만 캐싱됩니다.
 */
let cachedBankAccount: BankAccount | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

export async function getCachedBankAccount(): Promise<BankAccount> {
  // 서버 사이드 렌더링 환경이거나 캐시가 만료된 경우
  if (typeof window === 'undefined' || Date.now() > cacheExpiry) {
    const account = await getBankAccount();
    
    // 브라우저 환경에서만 캐싱
    if (typeof window !== 'undefined') {
      cachedBankAccount = account;
      cacheExpiry = Date.now() + CACHE_DURATION;
    }
    
    return account;
  }
  
  return cachedBankAccount || DEFAULT_BANK_ACCOUNT;
} 