import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronsUpDown } from "lucide-react"
import styled from "@emotion/styled"
import { css } from "@emotion/react"

const ComboboxContainer = styled.div<{ $isOpen?: boolean }>`
  position: relative;
  width: 100%;
  z-index: ${({ $isOpen }) => ($isOpen ? 9999 : 'auto')};
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

const ComboboxPopover = styled.div<{ $isOpen: boolean; $top: number; $left: number; $width: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => $width}px;
  z-index: 9999;
  background: white;
  border: 1px solid #d7d7d7;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
  
  /* 모달 내부에서 화면 밖으로 나가지 않도록 처리 */
  @media (max-width: 768px) {
    max-height: 250px;
  }
`

const ComboboxInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
  font-size: 14px;
  outline: none;

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
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue) return options
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue, searchable])

  // 포지션 계산
  React.useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const scrollY = window.scrollY || window.pageYOffset
          const scrollX = window.scrollX || window.pageXOffset
          
          setPopoverPosition({
            top: rect.bottom + scrollY + 4,
            left: rect.left + scrollX,
            width: rect.width,
          })
        }
      }
      
      updatePosition()
      
      // 스크롤이나 리사이즈 시 위치 업데이트
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest('[data-combobox-popover]')
      ) {
        setIsOpen(false)
        setSearchValue("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

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

  const popoverContent = isOpen ? (
    <ComboboxPopover
      data-combobox-popover
      $isOpen={isOpen}
      $top={popoverPosition.top}
      $left={popoverPosition.left}
      $width={popoverPosition.width}
    >
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
  ) : null

  return (
    <>
      <ComboboxContainer ref={containerRef} $isOpen={isOpen}>
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
      </ComboboxContainer>
      {typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  )
}

