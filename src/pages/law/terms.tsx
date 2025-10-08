/**
 * 이용약관 페이지
 * 
 * HUB Worship 서비스 이용약관을 표시합니다.
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import styled from "@emotion/styled";
import PageLayout from "@src/components/common/PageLayout";

const TermsPage = () => {
  return (
    <PageLayout>
      <Container>
        <Title>이용약관</Title>
        <UpdateDate>최종 수정일: 2025년 9월 30일</UpdateDate>
        
        <Section>
          <SectionTitle>제1조 (목적)</SectionTitle>
          <Content>
            본 약관은 HUB가 제공하는 HUB Worship 서비스(이하 "서비스"라 한다)의 이용과 관련하여 
            HUB와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </Content>
        </Section>

        <Section>
          <SectionTitle>제2조 (정의)</SectionTitle>
          <Content>
            본 약관에서 사용하는 용어의 정의는 다음과 같습니다:
            <List>
              <ListItem>1. "서비스"란 HUB가 제공하는 HUB Worship 관련 모든 서비스를 의미합니다.</ListItem>
              <ListItem>2. "회원"이란 본 약관에 동의하고 HUB와 서비스 이용계약을 체결한 자를 의미합니다.</ListItem>
              <ListItem>3. "아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이 정하고 HUB가 승인하는 문자와 숫자의 조합을 의미합니다.</ListItem>
              <ListItem>4. "비밀번호"란 회원이 부여받은 아이디와 일치되는 회원임을 확인하고 비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을 의미합니다.</ListItem>
              <ListItem>5. "다락방"이란 회원이 속한 다락방을 의미합니다.</ListItem>
              <ListItem>6. "그룹"이란 회원이 속한 그룹을 의미합니다.</ListItem>
              <ListItem>7. "공동체"이란 회원이 속한 공동체를 의미합니다.</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제3조 (약관의 게시와 개정)</SectionTitle>
          <Content>
            <List>
              <ListItem>1. HUB는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</ListItem>
              <ListItem>2. HUB는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</ListItem>
              <ListItem>3. HUB가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제4조 (회원가입)</SectionTitle>
          <Content>
            <List>
              <ListItem>1. 회원가입은 신청자가 온라인으로 HUB에서 제공하는 소정의 가입신청 양식에서 요구하는 사항을 기록하여 가입을 완료하는 것으로 성립됩니다.</ListItem>
              <ListItem>2. HUB는 다음 각 호에 해당하는 경우에는 회원가입을 거부할 수 있습니다:
                <SubList>
                  <ListItem>가. 타인의 명의를 사용하여 신청한 경우</ListItem>
                  <ListItem>나. 회원가입 신청서의 내용을 허위로 기재하거나 신청한 경우</ListItem>
                  <ListItem>다. 기타 회원으로 등록하는 것이 HUB의 기술상 현저히 지장이 있다고 판단되는 경우</ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제5조 (서비스의 제공 및 변경)</SectionTitle>
          <Content>
            <List>
              <ListItem>1. HUB는 회원에게 다음과 같은 서비스를 제공합니다:
                <SubList>
                  <ListItem>가. 찬양 자료 제공 서비스</ListItem>
                  <ListItem>나. 커뮤니티 서비스</ListItem>
                  <ListItem>다. 기타 HUB가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</ListItem>
                </SubList>
              </ListItem>
              <ListItem>2. HUB는 필요한 경우 서비스의 내용을 추가 또는 변경할 수 있습니다.</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제6조 (서비스의 중단)</SectionTitle>
          <Content>
            <List>
              <ListItem>1. HUB는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</ListItem>
              <ListItem>2. HUB는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 회원 또는 제3자가 입은 손해에 대하여 배상합니다. 단, HUB가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제7조 (회원의 의무)</SectionTitle>
          <Content>
            <List>
              <ListItem>1. 회원은 다음 행위를 하여서는 안 됩니다:
                <SubList>
                  <ListItem>가. 신청 또는 변경 시 허위내용의 등록</ListItem>
                  <ListItem>나. 타인의 정보 도용</ListItem>
                  <ListItem>다. HUB가 게시한 정보의 변경</ListItem>
                  <ListItem>라. 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</ListItem>
                  <ListItem>마. HUB와 기타 제3자의 저작권 등 지적재산권에 대한 침해</ListItem>
                  <ListItem>바. HUB 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</ListItem>
                  <ListItem>사. 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</ListItem>
                </SubList>
              </ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>제8조 (개인정보보호)</SectionTitle>
          <Content>
            HUB는 회원의 개인정보 보호를 위하여 노력합니다. 회원의 개인정보보호에 관해서는 관련법령 및 HUB가 정하는 "개인정보 처리방침"에 정한 바에 따릅니다.
          </Content>
        </Section>

        <Section>
          <SectionTitle>제9조 (분쟁의 해결)</SectionTitle>
          <Content>
            <List>
              <ListItem>1. HUB와 회원은 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.</ListItem>
              <ListItem>2. 제1항의 규정에도 불구하고 분쟁으로 인하여 소송이 제기될 경우 소송은 HUB의 본사 소재지를 관할하는 법원의 관할로 합니다.</ListItem>
            </List>
          </Content>
        </Section>

        <Section>
          <SectionTitle>부칙</SectionTitle>
          <Content>
            본 약관은 2025년 9월 30일부터 시행됩니다.
          </Content>
        </Section>
      </Container>
    </PageLayout>
  );
};

export default TermsPage;

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
