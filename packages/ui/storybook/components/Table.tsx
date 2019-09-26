import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Table, TableCell, TableProps, TableRow } from '../../src/components'

const radiosJustification = (label: string): TableProps['justification'] =>
	radios(label, {
		Left: 'justifyStart',
		Center: 'justifyCenter',
		Right: 'justifyEnd',
	})

storiesOf('Table', module).add('simple', () => {
	const useTableElement = boolean('Use table element', true)
	const useExampleHeading = boolean('Use example heading', true)
	const compact = boolean('Compact', false)
	const justification: TableProps['justification'] = radiosJustification('Table justification')
	const justificationFirstColumn: TableProps['justification'] = radiosJustification('First column justification')
	const justificationLastRow: TableProps['justification'] = radiosJustification('Last row justification')
	const shrinkLastColumn = boolean('Shrink last column', true)

	const heading = useExampleHeading ? <span>Simple table</span> : undefined

	return (
		<Table useTableElement={useTableElement} heading={heading} compact={compact} justification={justification}>
			{[1, 2, 3, 4, 5, 6].map(row => (
				<TableRow justification={row === 6 ? justificationLastRow : undefined}>
					{['A', 'B', 'C', 'D'].map(column => (
						<TableCell
							shrink={column === 'D' && shrinkLastColumn}
							justification={column === 'A' ? justificationFirstColumn : undefined}
						>
							Cell {row}
							{column}
						</TableCell>
					))}
				</TableRow>
			))}
		</Table>
	)
})