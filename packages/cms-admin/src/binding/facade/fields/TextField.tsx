import { TextInput, TextInputProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type TextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>

export const TextField = SimpleRelativeSingleField<TextFieldProps, string>((fieldMetadata, props) => {
	const generateOnChange = (data: FieldAccessor<string>) => (newValue: string) => {
		data.updateValue && data.updateValue(newValue)
	}
	return (
		<TextInput
			value={fieldMetadata.data.currentValue || ''}
			onChange={generateOnChange(fieldMetadata.data)}
			validationState={fieldMetadata.errors.length ? 'invalid' : undefined}
			allowNewlines={props.allowNewlines as any}
			{...props}
		/>
	)
}, 'TextField')
