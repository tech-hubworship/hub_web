"use client";

import React, { useState } from "react";
import styled from "@emotion/styled";
import { C, Section, Wrap, SectionHead, Kicker, H2, Panel, Tag } from "../styles";

const SubmitBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 17px;
  border-radius: 999px;
  background: ${C.green};
  color: #fff;
  font: inherit;
  font-weight: 750;
  font-size: 14px;
  border: 1px solid transparent;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.input`
  display: block;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #d8ded6;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  font-size: 14px;
  margin: 8px 0 14px;

  &:focus {
    outline: 2px solid #a8c1ab;
    outline-offset: 1px;
  }
`;

const TextArea = styled.textarea`
  display: block;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #d8ded6;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  font-size: 14px;
  margin: 8px 0 14px;
  resize: vertical;
  min-height: 120px;

  &:focus {
    outline: 2px solid #a8c1ab;
    outline-offset: 1px;
  }
`;

const StatusBox = styled.div<{ tone: "ok" | "err" }>`
  padding: 12px;
  border-radius: 10px;
  font-size: 13px;
  margin-top: 12px;
  background: ${(p) => (p.tone === "ok" ? "#edf4ed" : "#fbecec")};
  color: ${(p) => (p.tone === "ok" ? "#244d36" : "#8a2f2f")};
`;

const Label = styled.label`
  display: block;
  font-size: 14px;

  .opt {
    font-size: 12px;
    color: ${C.muted};
    font-weight: 400;
  }
`;

export default function QnA() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "err"; msg: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setResult({ tone: "err", msg: "질문 내용을 입력해주세요." });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/evangelism/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          question: question.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "질문 전송에 실패했습니다.");
      }
      setResult({
        tone: "ok",
        msg: data.message || "질문이 전달되었어요. 소중한 마음으로 읽겠습니다.",
      });
      setName("");
      setContact("");
      setQuestion("");
    } catch (err) {
      setResult({
        tone: "err",
        msg: (err as Error).message || "질문 전송에 실패했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section>
      <Wrap>
        <SectionHead>
          <div>
            <Kicker>QUESTIONS & ANSWERS</Kicker>
            <H2>궁금한 점을 남겨주세요</H2>
          </div>
          <p>정답을 몰라도 괜찮아요. 편하게 질문해 주세요.</p>
        </SectionHead>

        <Split>
          <Panel dark>
            <Tag>ASK ANYTHING</Tag>
            <h3>어떤 질문이든 환영합니다!</h3>
            <p>
              하나님은 정말 계실까? 교회는 어떤 곳일까? 믿음에 대한 고민부터 요즘
              마음을 무겁게 하는 이야기까지, 무엇이든 편하게 나눠주세요.
            </p>
            <p>
              저희가 모든 답을 알고 있거나 당장 고민을 해결해 드릴 수는 없겠지만,
              여러분의 이야기를 소중히 여기며 여러분의 마음과 삶을 위해 진심으로
              기도하겠습니다.
            </p>
            <p>
              답변을 받고 싶으시면 연락처를 남겨주세요. 남겨주신 연락처로 저희가
              정성껏 답해 드릴게요. (연락처 없이 익명으로 남기셔도 괜찮습니다.)
            </p>
          </Panel>

          <Panel>
            <form onSubmit={handleSubmit}>
              <Label htmlFor="ev-nickname">
                <strong>이름 또는 별명</strong> <span className="opt">(선택)</span>
              </Label>
              <Field
                id="ev-nickname"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="익명으로 남겨도 괜찮아요"
              />

              <Label htmlFor="ev-contact">
                <strong>답변 받을 연락처</strong>{" "}
                <span className="opt">(선택 · 남겨주시면 답변드려요)</span>
              </Label>
              <Field
                id="ev-contact"
                maxLength={200}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="이메일 · 카카오톡 ID · 전화번호 등 편한 방법으로"
              />

              <Label htmlFor="ev-question">
                <strong>질문 내용</strong>
              </Label>
              <TextArea
                id="ev-question"
                maxLength={3000}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="궁금한 점을 자유롭게 적어주세요."
                required
              />

              <SubmitBtn type="submit" disabled={submitting}>
                {submitting ? "전송 중..." : "질문 보내기"}
              </SubmitBtn>

              {result && (
                <StatusBox tone={result.tone} role="status">
                  {result.msg}
                </StatusBox>
              )}
            </form>
          </Panel>
        </Split>
      </Wrap>
    </Section>
  );
}
