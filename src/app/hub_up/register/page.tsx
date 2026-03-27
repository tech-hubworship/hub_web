"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { DepartureSlot, ReturnSlot, ElectiveLecture, HubUpConfig } from './types';

// Client-only: emotion + useSession + useRouter 모두 포함
const RegisterForm = dynamic(() => import('./RegisterForm'));

interface FormData {
  departureSlots: DepartureSlot[];
  returnSlots: ReturnSlot[];
  electives: ElectiveLecture[];
  config: HubUpConfig;
  initialSlotCounts: Record<string, number>;
}

// DB 없을 때 fallback (로컬 개발용)
const FALLBACK: FormData = {
  departureSlots: [
    { value: 'bus-선발대', label: '선발대', max_count: 43, is_active: true },
    { value: 'bus-18:00', label: '18:00', max_count: 86, is_active: true },
    { value: 'bus-18:30', label: '18:30', max_count: 86, is_active: true },
    { value: 'bus-19:00', label: '19:00', max_count: 258, is_active: true },
    { value: 'bus-20:00', label: '20:00', max_count: 172, is_active: true },
    { value: 'car', label: '자차/대중교통 이용', max_count: 0, is_active: true },
  ],
  returnSlots: [
    { value: 'bus-7:00', label: '7:00 (차세대 및 예배섬김에 한함)', max_count: 0, is_active: true },
    { value: 'bus-11:30', label: '11:30', max_count: 0, is_active: true },
    { value: 'car', label: '자차/대중교통 이용', max_count: 0, is_active: true },
  ],
  electives: [
    { value: '연애/결혼', label: '연애 / 결혼' },
    { value: '돈/재정', label: '돈 / 재정' },
  ],
  config: {
    registration_open: 'true',
    registration_deadline: '2025-04-26',
    fee_early_bird: '80000',
    fee_early_bird_until: '2025-04-18',
    fee_regular: '85000',
    bank_name: '하나은행',
    bank_account: '계좌번호',
    bank_holder: '예금주',
    contact_name: '서기MC',
    contact_phone: '010-8284-3283',
    event_dates: '2025-05-15 ~ 2025-05-17',
    event_venue: '소망 수양관',
    event_venue_address: '경기도 광주시 곤지암읍 건업길 122-83',
    max_capacity: '700',
  },
  initialSlotCounts: {},
};

function RegisterPageInner() {
  const [data, setData] = useState<FormData | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 이미 신청했는지 먼저 확인
    fetch('/api/hub-up/myinfo')
      .then((r) => r.json())
      .then((d) => {
        if (d.registration) {
          router.replace('/hub_up/myinfo');
          return;
        }
        // 신청 안 했으면 폼 데이터 로드
        return fetch('/api/hub-up/form-data')
          .then((r) => r.json())
          .then((fd) => {
            if (!fd.departureSlots?.length) {
              setData(FALLBACK);
            } else {
              setData({
                departureSlots: fd.departureSlots,
                returnSlots: fd.returnSlots,
                electives: fd.electives,
                config: fd.config,
                initialSlotCounts: fd.slotCounts || {},
              });
            }
          });
      })
      .catch(() => setData(FALLBACK));
  }, [router]);

  if (!data) {
    return null;
  }

  return <RegisterForm {...data} />;
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
