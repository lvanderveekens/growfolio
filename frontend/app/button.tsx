
"use client"

import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
    variant: "primary" | "secondary" | "tertiary" | "danger"
}

export const Button: React.FC<ButtonProps> = ({ className, variant, children, ...rest }) => {
    let variantClassName: string;
    
    switch (variant) {
      case "primary":
        variantClassName =
          "text-white border-green-400 bg-green-400 hover:bg-green-500 hover:border-green-500";
        break;
      case "secondary":
        variantClassName =
          "text-gray-600 bg-gray-100 border-gray-300 hover:bg-gray-300";
        break;
      case "tertiary":
        variantClassName =
          "text-white border-white hover:text-black hover:border-black";
        break;
      case "danger":
        variantClassName =
          "text-white border-red-500 bg-red-500 hover:bg-red-600 hover:border-red-600";
        break;
    }

    return (
      <button className={`${variantClassName} ${className} font-bold rounded-md border-2 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none`} {...rest}>
        {children}
      </button>
    );
}