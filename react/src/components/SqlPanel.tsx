import React, { useState } from 'react'; // React를 명시적으로 임포트
import styled from 'styled-components';
import Overlay from './Overlay';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: () => void;
}

export default function({ visible, onClose, onSuccess, onError }: Props){
  const [query, setQuery] = useState('');

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    try {
      const res = await fetch('/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        onError();
      }
    } catch (error) {
      onError();
      console.error('SQL execution failed', error);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <Panel>
        <Header>
          <strong>SQL Query Executer</strong>
          <button onClick={onClose}>✖</button>
        </Header>
        <Textarea
          value={query}
          onChange={handleQueryChange}
          placeholder="ex: SELECT * FROM member;"
        />
        <Button onClick={handleSubmit}>확인</Button>
      </Panel>
    </>
  );
};

const Panel = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  background: #1c1c1c;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #0f0;
`;

const Textarea = styled.textarea`
  width: 97%;
  height: 120px;
  background: #000;
  color: #0f0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: monospace;
  resize: vertical;
`;

const Button = styled.button`
  background: #333;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`;