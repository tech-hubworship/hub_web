/**
 * 사이트 소개 페이지
 * 
 * HUB Worship 웹사이트에 대한 소개 정보를 제공합니다.
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import styled from "@emotion/styled";
import PageLayout from "@src/components/common/PageLayout";

const IntroPage = () => {
  return (
    <PageLayout>
      <Container>
        <Title>사이트 소개</Title>
        <UpdateDate>최종 수정일: 2025년 9월 30일</UpdateDate>
        
        <Section>
          <SectionTitle>HUB Worship 웹사이트 소개</SectionTitle>
          <Content>
            본 웹사이트는 상업적 목적이 전혀 없는 HUB 공식 홈페이지입니다. 
            HUB의 행사 안내 등 HUB 관련 정보를 제공하기 위해 제작되었습니다.
          </Content>
        </Section>

        <Section>
          <SectionTitle>서비스 목적</SectionTitle>
          <Content>
            <List>
              <ListItem>1. HUB 행사 및 이벤트 정보 제공</ListItem>
              <ListItem>2. HUB 관련 소식 및 업데이트 전달</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>로그인 시스템</SectionTitle>
          <Content>
            <List>
              <ListItem>1. Google 계정 로그인
                <SubList>
                  <ListItem>- 사용자 식별을 위한 목적으로만 사용됩니다</ListItem>
                  <ListItem>- 그 외의 용도로는 활용되지 않습니다</ListItem>
                  <ListItem>- 최소한의 개인정보만 수집합니다</ListItem>
                </SubList>
              </ListItem>
              <ListItem>2. 개인정보 보호
                <SubList>
                  <ListItem>- 기본적인 기능 제공에 필요한 범위를 넘어선 개인정보는 수집하지 않습니다</ListItem>
                  <ListItem>- 자세한 내용은 개인정보 처리방침에서 확인하실 수 있습니다</ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>서비스 특징</SectionTitle>
          <Content>
            <List>
              <ListItem>1. 비상업적 운영
                <SubList>
                  <ListItem>- 모든 서비스는 무료로 제공됩니다</ListItem>
                  <ListItem>- 광고나 상업적 목적이 전혀 없습니다</ListItem>
                </SubList>
              </ListItem>
              <ListItem>2. 투명한 운영
                <SubList>
                  <ListItem>- 모든 정책과 약관을 공개합니다</ListItem>
                  <ListItem>- 사용자 피드백을 적극 수렴합니다</ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>개발 및 운영</SectionTitle>
          <Content>
            <List>
              <ListItem>1. 개발팀: HUB TECH</ListItem>
              <ListItem>2. 연락처: techhubworship@gmail.com</ListItem>
              <ListItem>3. 운영 목적: HUB 공식 서비스 제공</ListItem>
              <ListItem>4. 업데이트: 지속적인 서비스 개선 및 기능 추가</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>이용 안내</SectionTitle>
          <Content>
            <List>
              <ListItem>1. 서비스 이용 시 이용약관을 준수해 주세요</ListItem>
              <ListItem>2. 개인정보 처리에 대한 자세한 내용은 개인정보 처리방침을 참고하세요</ListItem>
              <ListItem>3. 문의사항이 있으시면 개발자에게 한마디 기능을 이용해 주세요</ListItem>
              <ListItem>4. 서비스 개선을 위한 피드백을 언제든 환영합니다</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>문의 및 연락처</SectionTitle>
          <Content>
            서비스 이용 중 궁금한 점이나 문의사항이 있으시면 언제든 연락해 주세요.
            
            <InfoBox>
              <InfoTitle>▶ 문의처</InfoTitle>
              <InfoItem>- 이메일: techhubworship@gmail.com</InfoItem>
              <InfoItem>- 개발팀: HUB TECH</InfoItem>
              <InfoItem>- 응답 시간: 영업일 기준 1-2일</InfoItem>
            </InfoBox>
          </Content>
        </Section>

        <Section>
          <SectionTitle>감사 인사</SectionTitle>
          <Content>
            HUB Worship 웹사이트를 이용해 주시는 모든 분들께 감사드립니다. 
            더 나은 서비스를 제공하기 위해 지속적으로 노력하겠습니다.
          </Content>
        </Section>
      </Container>
    </PageLayout>
  );
};

export default IntroPage;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 80px 20px;
  line-height: 1.8;
  color: #333;

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #000;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const UpdateDate = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 48px;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #000;
`;

const Content = styled.div`
  font-size: 15px;
  color: #444;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0;
`;

const SubList = styled.ul`
  list-style: none;
  padding-left: 24px;
  margin: 8px 0;
`;

const ListItem = styled.li`
  margin: 8px 0;
  line-height: 1.8;
`;

const InfoBox = styled.div`
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 16px 0;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  margin-bottom: 12px;
  color: #000;
`;

const InfoItem = styled.div`
  margin: 6px 0;
  color: #555;
`;
