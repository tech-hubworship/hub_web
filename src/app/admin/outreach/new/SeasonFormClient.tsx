"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "@emotion/styled";

interface Country { id: number; name_ko: string; iso_code: string; }

const currentYear = new Date().getFullYear();

export default function SeasonFormClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const galleryInputRef   = useRef<HTMLInputElement>(null);
  const prayerInputRef    = useRef<HTMLInputElement>(null);
  const heroInputRef      = useRef<HTMLInputElement>(null);

  const [countries, setCountries]           = useState<Country[]>([]);
  const [submitting, setSubmitting]         = useState(false);
  const [msg, setMsg]                       = useState("");

  // 새 국가 등록 토글
  const [showNewCountry, setShowNewCountry] = useState(false);
  const [newCountry, setNewCountry]         = useState({ name_ko: "", name_en: "", iso_code: "", lat: "", lng: "" });

  const [form, setForm] = useState({
    country_id: "",
    year: String(currentYear),
    period: "summer",
    start_date: "",
    end_date: "",
    leader_pastor: "",
    members: "",        // 쉼표 구분 → 배열로 변환
    prayer_topics: "",
    description: "",
  });

  const [heroUrl,       setHeroUrl]       = useState("");
  const [galleryUrls,   setGalleryUrls]   = useState<string[]>([]);
  const [prayerUrls,    setPrayerUrls]    = useState<string[]>([]);
  const [uploading,     setUploading]     = useState<"hero" | "gallery" | "prayer" | null>(null);

  const isAdmin = (session?.user as any)?.isAdmin;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) { router.replace("/"); return; }
    fetch("/api/admin/outreach/countries")
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []));
  }, [status, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 이미지 업로드 ─────────────────────────────────────────────
  async function uploadFiles(files: FileList, type: "hero" | "gallery" | "prayer") {
    setUploading(type);
    const isoCode = countries.find((c) => String(c.id) === form.country_id)?.iso_code ?? "misc";
    const results: string[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("iso_code", isoCode);
      fd.append("year", form.year);
      fd.append("period", form.period);
      const res = await fetch("/api/admin/outreach/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) results.push(json.url);
    }

    if (type === "hero")    setHeroUrl(results[0] ?? "");
    if (type === "gallery") setGalleryUrls((prev) => [...prev, ...results]);
    if (type === "prayer")  setPrayerUrls((prev)  => [...prev, ...results]);
    setUploading(null);
  }

  // ── 새 국가 등록 ──────────────────────────────────────────────
  async function addCountry() {
    const res = await fetch("/api/admin/outreach/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newCountry,
        lat: parseFloat(newCountry.lat),
        lng: parseFloat(newCountry.lng),
      }),
    });
    const json = await res.json();
    if (json.country) {
      setCountries((prev) => [...prev, json.country]);
      setForm((f) => ({ ...f, country_id: String(json.country.id) }));
      setShowNewCountry(false);
      setNewCountry({ name_ko: "", name_en: "", iso_code: "", lat: "", lng: "" });
    } else {
      alert(json.error ?? "국가 등록 실패");
    }
  }

  // ── 시즌 등록 ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.country_id) { setMsg("국가를 선택하세요."); return; }
    setSubmitting(true);
    setMsg("");

    const body = {
      country_id:      Number(form.country_id),
      year:            Number(form.year),
      period:          form.period,
      start_date:      form.start_date || null,
      end_date:        form.end_date   || null,
      leader_pastor:   form.leader_pastor || null,
      members:         form.members.split(",").map((s) => s.trim()).filter(Boolean),
      prayer_topics:   form.prayer_topics || null,
      description:     form.description   || null,
      hero_image_url:  heroUrl || null,
      gallery_urls:    galleryUrls,
      prayer_card_urls: prayerUrls,
    };

    const res = await fetch("/api/admin/outreach/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSubmitting(false);

    if (json.season) {
      router.push("/admin/outreach");
    } else {
      setMsg(json.error ?? "등록 실패");
    }
  }

  if (status === "loading") return <Wrap><p>불러오는 중...</p></Wrap>;

  return (
    <Wrap>
      <TopRow>
        <BackBtn onClick={() => router.push("/admin/outreach")}>← 목록으로</BackBtn>
        <h1>시즌 등록</h1>
      </TopRow>

      <Form onSubmit={handleSubmit}>

        {/* 국가 선택 */}
        <Field>
          <Label>국가 *</Label>
          <Row>
            <Select
              value={form.country_id}
              onChange={(e) => setForm((f) => ({ ...f, country_id: e.target.value }))}
              required
            >
              <option value="">— 국가 선택 —</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ko} ({c.iso_code})</option>
              ))}
            </Select>
            <AddBtn type="button" onClick={() => setShowNewCountry((v) => !v)}>
              {showNewCountry ? "취소" : "+ 새 국가"}
            </AddBtn>
          </Row>
        </Field>

        {showNewCountry && (
          <NewCountryBox>
            <NewCountryTitle>새 국가 등록</NewCountryTitle>
            <InlineGrid>
              <Input placeholder="한글명 (예: 태국)"         value={newCountry.name_ko}  onChange={(e) => setNewCountry((n) => ({ ...n, name_ko:  e.target.value }))} />
              <Input placeholder="영문명 (예: Thailand)"    value={newCountry.name_en}  onChange={(e) => setNewCountry((n) => ({ ...n, name_en:  e.target.value }))} />
              <Input placeholder="ISO alpha-3 (예: THA)"   value={newCountry.iso_code} onChange={(e) => setNewCountry((n) => ({ ...n, iso_code: e.target.value }))} />
              <Input placeholder="위도 (예: 15.87)"         value={newCountry.lat}      onChange={(e) => setNewCountry((n) => ({ ...n, lat:      e.target.value }))} />
              <Input placeholder="경도 (예: 100.99)"        value={newCountry.lng}      onChange={(e) => setNewCountry((n) => ({ ...n, lng:      e.target.value }))} />
              <SubmitBtn type="button" onClick={addCountry}>등록</SubmitBtn>
            </InlineGrid>
            <Hint>ISO 코드 및 좌표는 <a href="https://www.iban.com/country-codes" target="_blank" rel="noreferrer">iban.com</a> 참고</Hint>
          </NewCountryBox>
        )}

        {/* 연도 / 계절 */}
        <TwoCol>
          <Field>
            <Label>연도 *</Label>
            <Input
              type="number"
              min={2000}
              max={currentYear + 1}
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              required
            />
          </Field>
          <Field>
            <Label>계절 *</Label>
            <Select
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
            >
              <option value="summer">여름 (Summer)</option>
              <option value="winter">겨울 (Winter)</option>
            </Select>
          </Field>
        </TwoCol>

        {/* 기간 */}
        <TwoCol>
          <Field>
            <Label>출발일</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </Field>
          <Field>
            <Label>귀국일</Label>
            <Input type="date" value={form.end_date}   onChange={(e) => setForm((f) => ({ ...f, end_date:   e.target.value }))} />
          </Field>
        </TwoCol>

        {/* 인솔 교역자 */}
        <Field>
          <Label>인솔 교역자</Label>
          <Input
            placeholder="예: 홍길동 목사"
            value={form.leader_pastor}
            onChange={(e) => setForm((f) => ({ ...f, leader_pastor: e.target.value }))}
          />
        </Field>

        {/* 참여자 명단 */}
        <Field>
          <Label>참여 멤버 <small>(쉼표로 구분)</small></Label>
          <Textarea
            rows={3}
            placeholder="홍길동, 김철수, 이영희, ..."
            value={form.members}
            onChange={(e) => setForm((f) => ({ ...f, members: e.target.value }))}
          />
        </Field>

        {/* 기도제목 */}
        <Field>
          <Label>선교사 기도제목</Label>
          <Textarea
            rows={5}
            placeholder="기도제목을 입력하세요."
            value={form.prayer_topics}
            onChange={(e) => setForm((f) => ({ ...f, prayer_topics: e.target.value }))}
          />
        </Field>

        {/* 짧은 설명 */}
        <Field>
          <Label>짧은 설명 (선택)</Label>
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        {/* 대표 단체사진 */}
        <Field>
          <Label>대표 단체사진</Label>
          <input ref={heroInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => e.target.files && uploadFiles(e.target.files, "hero")} />
          <UploadBtn type="button" onClick={() => heroInputRef.current?.click()} disabled={uploading === "hero"}>
            {uploading === "hero" ? "업로드 중..." : "사진 선택"}
          </UploadBtn>
          {heroUrl && <PreviewImg src={heroUrl} alt="대표사진 미리보기" />}
        </Field>

        {/* 갤러리 */}
        <Field>
          <Label>갤러리 <small>(여러 장 선택 가능)</small></Label>
          <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={(e) => e.target.files && uploadFiles(e.target.files, "gallery")} />
          <UploadBtn type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading === "gallery"}>
            {uploading === "gallery" ? "업로드 중..." : "사진 선택"}
          </UploadBtn>
          {galleryUrls.length > 0 && (
            <ThumbGrid>
              {galleryUrls.map((url) => (
                <ThumbWrap key={url}>
                  <Thumb src={url} alt="" />
                  <RemoveBtn type="button" onClick={() => setGalleryUrls((p) => p.filter((u) => u !== url))}>✕</RemoveBtn>
                </ThumbWrap>
              ))}
            </ThumbGrid>
          )}
        </Field>

        {/* 기도카드 */}
        <Field>
          <Label>기도카드 이미지 <small>(여러 장 선택 가능)</small></Label>
          <input ref={prayerInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={(e) => e.target.files && uploadFiles(e.target.files, "prayer")} />
          <UploadBtn type="button" onClick={() => prayerInputRef.current?.click()} disabled={uploading === "prayer"}>
            {uploading === "prayer" ? "업로드 중..." : "사진 선택"}
          </UploadBtn>
          {prayerUrls.length > 0 && (
            <ThumbGrid>
              {prayerUrls.map((url) => (
                <ThumbWrap key={url}>
                  <Thumb src={url} alt="" />
                  <RemoveBtn type="button" onClick={() => setPrayerUrls((p) => p.filter((u) => u !== url))}>✕</RemoveBtn>
                </ThumbWrap>
              ))}
            </ThumbGrid>
          )}
        </Field>

        {msg && <ErrMsg>{msg}</ErrMsg>}

        <SubmitRow>
          <SubmitBtn type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "시즌 등록"}
          </SubmitBtn>
        </SubmitRow>
      </Form>
    </Wrap>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 28px 20px 60px;
`;

const TopRow = styled.div`
  margin-bottom: 24px;
  h1 { font-size: 20px; margin: 8px 0 0; }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  small { font-weight: 400; color: #9ca3af; margin-left: 4px; }
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #6366f1; }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  width: 100%;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #6366f1; }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  &:focus { outline: none; border-color: #6366f1; }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const AddBtn = styled.button`
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
`;

const NewCountryBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
`;

const NewCountryTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px;
  color: #374151;
`;

const InlineGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  @media (min-width: 480px) { grid-template-columns: 1fr 1fr 1fr; }
`;

const Hint = styled.p`
  font-size: 11px;
  color: #9ca3af;
  margin: 8px 0 0;
  a { color: #6366f1; }
`;

const UploadBtn = styled.button`
  padding: 10px 16px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-start;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PreviewImg = styled.img`
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 6px;
  margin-top: 6px;
`;

const ThumbGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const ThumbWrap = styled.div`
  position: relative;
`;

const Thumb = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.55);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
`;

const ErrMsg = styled.p`
  color: #ef4444;
  font-size: 13px;
  margin: 0;
`;

const SubmitRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SubmitBtn = styled.button`
  padding: 12px 28px;
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
