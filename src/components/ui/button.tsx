import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('button', { variants: { variant: { default: '', secondary: 'button-secondary', outline: 'button-outline' }, size: { default: '', small: 'button-small' } }, defaultVariants: { variant: 'default', size: 'default' } })
type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
export const Button = forwardRef<HTMLButtonElement, Props>(({ className, variant, size, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />)
Button.displayName = 'Button'
