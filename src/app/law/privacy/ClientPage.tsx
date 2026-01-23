"use client";

import styled from "@emotion/styled";
import PageLayout from "@src/components/common/PageLayout";

export default function ClientPage() {
  return (
    <PageLayout>
      <Container>
        <Title>개인정보 처리방침</Title>
        <UpdateDate>최종 수정일: 2025년 9월 30일</UpdateDate>

        <Section>
          <Content>
            HUB는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고
            이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여
            다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </Content>
        </Section>

        <Section>
          <SectionTitle>제1조 (개인정보의 처리 목적)</SectionTitle>
          <Content>
            HUB는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
            개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
            변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등
            필요한 조치를 이행할 예정입니다.
            <List>
              <ListItem>
                1. 홈페이지 회원 가입 및 관리
                <SubList>
                  <ListItem>
                    - 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인
                    식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적으로
                    개인정보를 처리합니다.
                  </ListItem>
                </SubList>
              </ListItem>
              <ListItem>
                2. 서비스 제공
                <SubList>
                  <ListItem>
                    - 서비스 제공, 콘텐츠 제공, 본인인증을 목적으로 개인정보를
                    처리합니다.
                  </ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제2조 (개인정보의 처리 및 보유기간)</SectionTitle>
          <Content>
            <List>
              <ListItem>
                1. HUB는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
                개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
                개인정보를 처리·보유합니다.
              </ListItem>
              <ListItem>
                2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                <SubList>
                  <ListItem>
                    - 홈페이지 회원 가입 및 관리: 회원 탈퇴 시까지 (다만, 관계 법령
                    위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료
                    시까지)
                  </ListItem>
                  <ListItem>
                    - 재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료
                    시까지
                  </ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제3조 (처리하는 개인정보의 항목)</SectionTitle>
          <Content>
            HUB는 다음의 개인정보 항목을 처리하고 있습니다:
            <List>
              <ListItem>
                1. 회원 가입 및 관리
                <SubList>
                  <ListItem>- 필수항목: 이름, 생년월일</ListItem>
                  <ListItem>- 선택항목: 다락방, 그룹, 공동체</ListItem>
                </SubList>
              </ListItem>
              <ListItem>
                2. 서비스 이용 과정에서 자동으로 생성되어 수집되는 정보
                <SubList>
                  <ListItem>- IP주소, 쿠키, 서비스 이용 기록, 방문 기록</ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제4조 (개인정보의 제3자 제공)</SectionTitle>
          <Content>
            <List>
              <ListItem>
                1. HUB는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한
                범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보
                보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </ListItem>
              <ListItem>2. HUB는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다.</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제5조 (개인정보처리의 위탁)</SectionTitle>
          <Content>
            <List>
              <ListItem>
                1. HUB는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
                <SubList>
                  <ListItem>- 클라우드 서비스 제공: Supabase (데이터 보관)</ListItem>
                  <ListItem>- 인증 서비스: Google OAuth, Kakao OAuth</ListItem>
                </SubList>
              </ListItem>
              <ListItem>
                2. HUB는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지,
                기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서
                등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제6조 (정보주체의 권리·의무 및 행사방법)</SectionTitle>
          <Content>
            <List>
              <ListItem>
                1. 정보주체는 HUB에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
                <SubList>
                  <ListItem>- 개인정보 열람 요구</ListItem>
                  <ListItem>- 오류 등이 있을 경우 정정 요구</ListItem>
                  <ListItem>- 삭제 요구</ListItem>
                  <ListItem>- 처리정지 요구</ListItem>
                </SubList>
              </ListItem>
              <ListItem>
                2. 제1항에 따른 권리 행사는 HUB에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며 HUB는 이에 대해
                지체없이 조치하겠습니다.
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제7조 (개인정보의 파기)</SectionTitle>
          <Content>
            <List>
              <ListItem>
                1. HUB는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </ListItem>
              <ListItem>
                2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:
                <SubList>
                  <ListItem>- 파기절차: HUB는 파기 사유가 발생한 개인정보를 선정하고, HUB의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</ListItem>
                  <ListItem>- 파기방법: HUB는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제8조 (개인정보의 안전성 확보조치)</SectionTitle>
          <Content>
            HUB는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
            <List>
              <ListItem>1. 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</ListItem>
              <ListItem>2. 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</ListItem>
              <ListItem>3. 물리적 조치: 전산실, 자료보관실 등의 접근통제</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제9조 (개인정보 보호책임자)</SectionTitle>
          <Content>
            <List>
              <ListItem>
                1. HUB는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
                <InfoBox>
                  <InfoTitle>▶ 개인정보 보호책임자</InfoTitle>
                  <InfoItem>- 담당부서: HUB TECH</InfoItem>
                  <InfoItem>- 연락처: techhubworship@gmail.com</InfoItem>
                </InfoBox>
              </ListItem>
              <ListItem>
                2. 정보주체께서는 HUB의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제10조 (개인정보 처리방침 변경)</SectionTitle>
          <Content>
            이 개인정보 처리방침은 2025년 9월 30일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </Content>
        </Section>
      </Container>
    </PageLayout>
  );
}

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

