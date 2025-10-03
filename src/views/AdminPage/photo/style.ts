// 파일 경로: src/views/AdminPage/design.style.ts

import styled from '@emotion/styled';

export const DownloadContainer = styled.div`
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    background: #fff;
    color: #333;
`;

export const StatText = styled.p`
    font-size: 1.1rem;
    color: #333;
    strong {
        color: #007bff;
        font-size: 1.3rem;
    }
`;

export const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    label { 
        font-weight: 500; 
        font-size: 0.9rem;
        color: #495057;
    }
    input { 
        padding: 10px; 
        border-radius: 6px; 
        border: 1px solid #ccc; 
        width: 100%; 
        font-size: 1rem;
    }
`;

export const DownloadButton = styled.button`
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 10px;

    &:hover:not(:disabled) { 
        background: #0056b3; 
    }
    &:disabled { 
        background: #aaa; 
        cursor: not-allowed; 
    }
`;

export const ErrorMessage = styled.p`
    color: #e74c3c;
    font-size: 1rem;
`;