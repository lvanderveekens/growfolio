
"use client"

import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
    variant: "primary" | "secondary" | "danger"
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
          "text-gray-600 border-gray-200 hover:border-gray-500";
        break;
      case "danger":
        variantClassName =
          "text-white border-red-500 bg-red-500 hover:bg-red-600 hover:border-red-600";
        break;
    }

    return (
      <button className={`${variantClassName} ${className} font-bold rounded-md border px-4 py-2 disabled:opacity-50 disabled:pointer-events-none`} {...rest}>
        {children}
      </button>
    );
}