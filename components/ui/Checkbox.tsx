import React, { forwardRef } from 'react'
import { Form } from 'react-bootstrap'
import classNames from 'classnames'

export interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'onChange'> {
    color?: string
    className?: string
    disabled?: boolean
    onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
    const {
        className,
        color,
        disabled = false,
        onChange,
        ...rest
    } = props

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.checked, e)
    }

    const checkboxClass = classNames(
        'form-check-input',
        color && `text-${color}`,
        className
    )

    return (
        <input
            type="checkbox"
            ref={ref}
            className={checkboxClass}
            disabled={disabled}
            onChange={handleChange}
            {...rest}
        />
    )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
