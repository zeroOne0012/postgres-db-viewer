import React, { useEffect } from 'react';
import styled from 'styled-components';

export interface ToastMessage {
  id: number;
  message: string;
  isOk: boolean;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  useEffect(() => {
    const timers = toasts.map(toast =>
      setTimeout(() => removeToast(toast.id), 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  return (
    <Wrapper>
      {toasts.map((toast) => (
        <Toast key={toast.id} isOk={toast.isOk} onClick={()=>removeToast(toast.id)}>{toast.message}</Toast>
      ))}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Toast = styled.div<{ isOk: boolean }>`
  min-width: 250px;
  background-color: ${(props) => (props.isOk ? '#0a0' : '#c00')};
  color: #fff;
  text-align: center;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;
