"use client";

import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { MapPin, Star, ExternalLink, Clock, Phone } from "lucide-react";
import dynamic from "next/dynamic";
import { Header } from "@src/components/Header";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #fef7ed 0%, #fff7ed 50%, #ffedd5 100%);
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
`;

const AppScreen = styled(motion.div)`
  width: 100%;
  background: transparent;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
`;

const AppHeader = styled.div`
  padding: 100px 24px 24px;
  text-align: left;

  @media (max-width: 768px) {
    padding: 72px 20px 20px;
  }
`;

const AppTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 26px;
  }
`;

const AppSubtitle = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 18px;
    padding: 0 20px;
  }
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 24px 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 0 20px 16px;
    gap: 8px;
  }
`;

const CategoryButton = styled.button<{ $active: boolean }>`
  padding: 10px 18px;
  border-radius: 20px;
  border: 2px solid ${(props) => (props.$active ? "#ea580c" : "#e5e7eb")};
  background: ${(props) => (props.$active ? "#ea580c" : "#ffffff")};
  color: ${(props) => (props.$active ? "#ffffff" : "#374151")};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ea580c;
    background: ${(props) => (props.$active ? "#c2410c" : "#fff7ed")};
    color: ${(props) => (props.$active ? "#fff" : "#ea580c")};
  }
`;

const PopularGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 0 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 20px 24px;
    gap: 16px;
  }
`;

const ListSection = styled.div`
  padding: 0 24px 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 0 20px 20px;
  }
`;

const Card = styled(motion.div)<{ $featured?: boolean }>`
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid ${(props) => (props.$featured ? "#fed7aa" : "#e5e7eb")};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(234, 88, 12, 0.12);
    border-color: #fdba74;
  }
`;

const CardName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardCategory = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #ea580c;
  background: #fff7ed;
  padding: 4px 10px;
  border-radius: 12px;
`;

const CardAddress = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  & svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const CardMeta = styled.div`
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
`;

const MapLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #ea580c;
  text-decoration: none;
  margin-top: 8px;
  transition: color 0.2s;

  &:hover {
    color: #c2410c;
    text-decoration: underline;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #6b7280;
  padding: 40px 24px;
  font-size: 15px;
`;

const CATEGORIES = ["전체", "한식", "양식", "중식", "일식", "카페", "기타"];

interface RestaurantItem {
  id: number;
  name: string;
  category: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  image_url: string | null;
  phone: string | null;
  opening_hours: string | null;
  is_featured?: boolean;
  created_at: string;
}

function getKakaoMapUrl(item: RestaurantItem): string {
  const query = encodeURIComponent([item.name, item.address].filter(Boolean).join(" "));
  return `https://map.kakao.com/link/search/${query}`;
}

export default function RestaurantClientPage() {
  const [category, setCategory] = useState("전체");
  const [list, setList] = useState<RestaurantItem[]>([]);
  const [popular, setPopular] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "전체") params.set("category", category);
    fetch(`/api/public/restaurant?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setList(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    fetch("/api/public/restaurant/popular")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setPopular(json.data);
      })
      .catch(console.error);
  }, []);

  const filteredList = category === "전체" ? list : list.filter((r) => r.category === category);

  return (
    <>
      <Header />
      <Container>
        <AppScreen
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AppHeader>
            <AppTitle>허브 맛집지도</AppTitle>
            <AppSubtitle>
              공동체가 추천하는 맛집을 함께 나눕니다. 오늘 점심, 순모임 장소로 활용해 보세요.
            </AppSubtitle>
          </AppHeader>

          <CategoryFilter>
            {CATEGORIES.map((c) => (
              <CategoryButton
                key={c}
                $active={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </CategoryButton>
            ))}
          </CategoryFilter>

          {popular.length > 0 && (
            <>
              <SectionTitle>
                <Star size={22} color="#ea580c" fill="#ea580c" />
                인기 맛집
              </SectionTitle>
              <PopularGrid>
                {popular.map((item) => (
                  <Card
                    key={item.id}
                    $featured
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardName>
                      {item.name}
                      <CardCategory>{item.category}</CardCategory>
                    </CardName>
                    {item.address && (
                      <CardAddress>
                        <MapPin size={14} />
                        {item.address}
                      </CardAddress>
                    )}
                    {item.description && (
                      <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0" }}>
                        {item.description}
                      </p>
                    )}
                    <CardMeta>
                      {item.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={12} /> {item.phone}
                        </span>
                      )}
                      {item.opening_hours && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {item.opening_hours}
                        </span>
                      )}
                    </CardMeta>
                    <MapLink
                      href={getKakaoMapUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} />
                      카카오맵에서 보기
                    </MapLink>
                  </Card>
                ))}
              </PopularGrid>
            </>
          )}

          <SectionTitle>
            <MapPin size={22} />
            {category === "전체" ? "맛집 목록" : `${category} 맛집`}
          </SectionTitle>

          {loading ? (
            <EmptyMessage>로딩 중...</EmptyMessage>
          ) : filteredList.length === 0 ? (
            <EmptyMessage>
              {category === "전체" ? "등록된 맛집이 없습니다." : `이 카테고리의 맛집이 없습니다.`}
            </EmptyMessage>
          ) : (
            <ListSection>
              <PopularGrid as="div" style={{ padding: 0 }}>
                {filteredList.map((item) => (
                  <Card
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardName>
                      {item.name}
                      <CardCategory>{item.category}</CardCategory>
                    </CardName>
                    {item.address && (
                      <CardAddress>
                        <MapPin size={14} />
                        {item.address}
                      </CardAddress>
                    )}
                    {item.description && (
                      <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0" }}>
                        {item.description}
                      </p>
                    )}
                    <CardMeta>
                      {item.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={12} /> {item.phone}
                        </span>
                      )}
                      {item.opening_hours && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {item.opening_hours}
                        </span>
                      )}
                    </CardMeta>
                    <MapLink
                      href={getKakaoMapUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} />
                      카카오맵에서 보기
                    </MapLink>
                  </Card>
                ))}
              </PopularGrid>
            </ListSection>
          )}
        </AppScreen>
      </Container>
      <Footer />
    </>
  );
}
