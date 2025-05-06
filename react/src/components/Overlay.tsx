import React from 'react';
import styled from 'styled-components';

const OverlayWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 998;
`;

export default function({ onClick }: { onClick: () => void }){
  return <OverlayWrapper onClick={onClick} />;
};
