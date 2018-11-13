import { Card, FormGroup } from '@blueprintjs/core'
import { Elevation } from '@blueprintjs/core/src/common/elevation'
import * as React from 'react'
import {
	DataContext,
	EnforceSubtypeRelation,
	Props,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor } from '../../dao'
import { AddNewButton, UnlinkButton } from '../buttons'

export interface RepeaterProps extends ToManyProps {}

class Repeater extends React.PureComponent<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<ToMany.CollectionRetriever {...this.props}>
				{(field: EntityCollectionAccessor) => {
					return (
						<Repeater.EntityCollection entities={field} label={this.props.label}>
							{this.props.children}
						</Repeater.EntityCollection>
					)
				}}
			</ToMany.CollectionRetriever>
		)
	}

	public static generateSyntheticChildren(props: Props<RepeaterProps>): React.ReactNode {
		return <ToMany {...props}>{props.children}</ToMany>
	}
}

namespace Repeater {
	export interface ItemProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export class Item extends React.PureComponent<ItemProps> {
		public render() {
			return (
				<DataContext.Provider value={this.props.entity}>
					<div className="repeaterItem">
						<Card elevation={Elevation.ONE} className="repeaterItem-in">
							<div className="repeaterItem-content">{this.props.children}</div>
							{this.props.displayUnlinkButton && <UnlinkButton className="repeaterItem-button" />}
						</Card>
					</div>
				</DataContext.Provider>
			)
		}
	}

	export interface EntityCollectionProps {
		entities: EntityCollectionAccessor
		label?: ToManyProps['label']
	}

	export class EntityCollection extends React.PureComponent<EntityCollectionProps> {
		public render() {
			const entities = filterEntities(this.props.entities)
			return (
				// Intentionally not applying label system middleware
				<FormGroup label={this.props.label}>
					<Cloneable entities={this.props.entities}>
						{entities.map(entity => (
							<Item displayUnlinkButton={entities.length > 1} entity={entity} key={entity.getKey()}>
								{this.props.children}
							</Item>
						))}
					</Cloneable>
				</FormGroup>
			)
		}
	}

	export interface CloneableProps {
		entities?: EntityCollectionAccessor
		addNew?: EntityCollectionAccessor['addNew']
	}

	export class Cloneable extends React.PureComponent<CloneableProps> {
		public render() {
			return (
				<div className="cloneable">
					<div className="cloneable-content">{this.props.children}</div>
					<AddNewButton
						addNew={this.props.entities ? this.props.entities.addNew : this.props.addNew}
						className="cloneable-button"
					/>
				</div>
			)
		}
	}

	export const filterEntities = (entities: EntityCollectionAccessor): EntityAccessor[] => {
		return entities.entities.filter((item): item is EntityAccessor => item instanceof EntityAccessor)
	}
}

export { Repeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, SyntheticChildrenProvider<RepeaterProps>>
