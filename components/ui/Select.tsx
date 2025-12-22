import React from 'react'
import ReactSelect, { Props as ReactSelectProps } from 'react-select'

export interface SelectProps extends ReactSelectProps {
    instanceId?: string
    size?: 'sm' | 'md' | 'lg'
}

const Select = <Option extends unknown = unknown>(props: SelectProps) => {
    const {
        size = 'md',
        className,
        ...rest
    } = props

    const customStyles = {
        control: (base: any, state: any) => ({
            ...base,
            minHeight: size === 'sm' ? '32px' : size === 'lg' ? '48px' : '38px',
            fontSize: size === 'sm' ? '0.875rem' : '1rem',
            borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
            boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
            '&:hover': {
                borderColor: '#86b7fe'
            }
        }),
        option: (base: any, state: any) => ({
            ...base,
            fontSize: size === 'sm' ? '0.875rem' : '1rem',
            backgroundColor: state.isSelected 
                ? '#0d6efd' 
                : state.isFocused 
                    ? '#e7f1ff' 
                    : 'white',
            color: state.isSelected ? 'white' : '#212529',
            '&:active': {
                backgroundColor: '#0d6efd'
            }
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 9999
        })
    }

    return (
        <ReactSelect
            className={className}
            styles={customStyles}
            {...rest}
        />
    )
}

export default Select
