import React from 'react';
import { Select as AntSelect, SelectProps } from 'antd';

// Wrapper dla Select który naprawia problemy z renderowaniem
export const Select: React.FC<SelectProps> = (props) => {
  return (
    <AntSelect
      {...props}
      // Wyłączamy virtual scroll - to często powoduje problemy
      virtual={false}
      // Wymuszamy portal rendering
      getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
      // Dodajemy własny styl dla dropdown
      dropdownStyle={{
        zIndex: 10000,
        ...props.dropdownStyle
      }}
      // Upewniamy się, że dropdown jest widoczny
      dropdownRender={(menu) => (
        <div 
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {menu}
        </div>
      )}
    />
  );
};

// Eksportujemy też Option jeśli ktoś tego potrzebuje (przestarzałe)
export const Option = AntSelect.Option;

export default Select;
