import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

interface DropdownProps {
  className?: string;
  selected?: DropdownOption;
  placeholder?: string;
  onChange: (option: DropdownOption) => void;
  options: DropdownOption[];
}

export interface DropdownOption {
  label: string;
  value: any;
}

const Dropdown: React.FC<DropdownProps> = ({
  className,
  selected,
  placeholder,
  onChange,
  options,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = (event: any) => {
    event.stopPropagation()
    setIsOpen(!isOpen);
  };

  const selectOption = (option: DropdownOption) => {
    onChange(option);
    setIsOpen(false);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleEscapeKey = (event: any) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    const handleOutsideClick = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("click", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div className={`${className} bg-white relative block w-full`} ref={dropdownRef}>
      <div>
        <button
          type="button"
          className="inline-flex justify-between items-center w-full px-2 py-2 border hover:bg-gray-50"
          id="options-menu"
          onClick={toggleDropdown}
        >
          {selected ? (
            <span>{selected.label}</span>
          ) : (
            <span className="text-gray-400">{placeholder ?? "Select an option"}</span>
          )}
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      {isOpen && (
        <div className="z-10 absolute -mt-[1px] left-0 w-full origin-top-right bg-white border">
          {options.map((option) => (
            <div
              key={option.value}
              className="block px-2 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={(event) => {
                selectOption(option);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
