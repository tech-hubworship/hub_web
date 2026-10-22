import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import styled from "@emotion/styled"
import { css } from "@emotion/react"

const ComboboxContainer = styled.div`
  position: relative;
  width: 100%;
`

const ComboboxButton = styled.button<{ $isOpen?: boolean; $disabled?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  color: #000;
  background-color: white;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #007bff;
  }

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
    `}

  @media (max-width: 768px) {
    height: 44px;
    font-size: 16px;
    padding: 0 14px;
  }
`

const ComboboxValue = styled.span<{ $placeholder?: boolean }>`
  flex: 1;
  text-align: left;
  color: ${({ $placeholder }) => ($placeholder ? "#999" : "#000")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ComboboxIcon = styled(ChevronsUpDown)`
  height: 16px;
  width: 16px;
  margin-left: 8px;
  opacity: 0.5;
  flex-shrink: 0;
`

const ComboboxPopover = styled.div<{ $isOpen: boolean; $dropUp?: boolean }>`
  position: absolute;
  ${({ $dropUp }) =>
    $dropUp
      ? css`
          bottom: calc(100% + 8px);
        `
      : css`
          top: calc(100% + 8px);
        `}
  left: 0;
  right: 0;
  z-index: 9999;
  background: white;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.18), 0 2px 6px -1px rgba(0, 0, 0, 0.08);
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};

  @media (max-width: 768px) {
    max-height: 250px;
  }
`

const ComboboxInput = styled.input`
  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  background: white;

  &:focus {
    outline: none;
  }
`

const ComboboxList = styled.div`
  padding: 4px;
`

const ComboboxItem = styled.button<{ $isSelected?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 16px;
  color: #000;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
  box-sizing: border-box;

  &:hover {
    background-color: #f3f4f6;
  }

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      background-color: #eff6ff;
      color: #007bff;
    `}
`

const CheckIcon = styled(Check)`
  height: 16px;
  width: 16px;
  margin-right: 8px;
  flex-shrink: 0;
`

const EmptyState = styled.div`
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 14px;
`

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  required?: boolean
  name?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  disabled = false,
  searchable = true,
  required = false,
  name,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [dropUp, setDropUp] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue) return options
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue, searchable])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchValue("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("scroll", decidePlacement, true)
      window.addEventListener("resize", decidePlacement)
      // 열릴 때 방향(위/아래) 결정 후 검색창 포커스
      decidePlacement()
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("scroll", decidePlacement, true)
      window.removeEventListener("resize", decidePlacement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // 트리거 아래 공간이 부족(화면 끝/푸터에 가릴 때)하면 위로 펼친다.
  function decidePlacement() {
    const btn = containerRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight
    const popoverH = Math.min(popoverRef.current?.offsetHeight || 300, 300)

    // 화면에 실제로 보이는 푸터가 트리거 아래쪽에 있으면, 그 상단을 '아래 한계'로 삼는다.
    // (position 이 relative 여도 내용이 짧아 뷰포트 하단에 보이면 드롭다운이 가려지므로)
    const footer = document.querySelector("footer") as HTMLElement | null
    let bottomLimit = viewportH
    if (footer) {
      const fRect = footer.getBoundingClientRect()
      if (fRect.top > rect.bottom && fRect.top < viewportH) {
        bottomLimit = fRect.top
      }
    }

    const spaceBelow = bottomLimit - rect.bottom
    const spaceAbove = rect.top - 8 // 상단 헤더 여유
    // 아래 공간이 팝오버보다 좁고, 위 공간이 더 넓으면 위로
    setDropUp(spaceBelow < popoverH && spaceAbove > spaceBelow)
  }

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
    setSearchValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      setSearchValue("")
    }
  }

  return (
    <ComboboxContainer ref={containerRef}>
      <input type="hidden" name={name} value={value || ""} required={required} />
      <ComboboxButton
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        $isOpen={isOpen}
        onKeyDown={handleKeyDown}
      >
        <ComboboxValue $placeholder={!selectedOption}>
          {selectedOption ? selectedOption.label : placeholder}
        </ComboboxValue>
        <ComboboxIcon />
      </ComboboxButton>
      <ComboboxPopover ref={popoverRef} $isOpen={isOpen} $dropUp={dropUp}>
        {searchable && (
          <ComboboxInput
            ref={inputRef}
            type="text"
            placeholder="검색..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredOptions.length === 1) {
                handleSelect(filteredOptions[0].value)
              }
            }}
          />
        )}
        <ComboboxList>
          {filteredOptions.length === 0 ? (
            <EmptyState>결과가 없습니다</EmptyState>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxItem
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                $isSelected={option.value === value}
              >
                {option.value === value && <CheckIcon />}
                {option.label}
              </ComboboxItem>
            ))
          )}
        </ComboboxList>
      </ComboboxPopover>
    </ComboboxContainer>
  )
}
