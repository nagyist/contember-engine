import prom from 'prom-client'
import { ProjectInfoMiddlewareState } from '../project-common'
import { KoaMiddleware } from '../application'
import { ModuleInfoMiddlewareState } from '../common'
import { GraphQLKoaState } from '../graphql'

export const createColllectHttpMetricsMiddleware = (
	registry: prom.Registry,
): KoaMiddleware<Partial<ProjectInfoMiddlewareState & ModuleInfoMiddlewareState & GraphQLKoaState>> => {
	const requestSummary = new prom.Histogram({
		name: 'contember_http_duration_seconds',
		help: '[DEPRECATED] Incoming HTTP requests statistics by http_method (OPTIONS requests are ignored), http_code, contember_project (or "unknown" for undefined project), contember_project_group (or "unknown" for undefined project group), contember_module (system, tenant, content, unknown) and graphql_operation (query, mutation, unknown)',
		registers: [registry],
		labelNames: ['http_method', 'http_code', 'contember_project', 'contember_project_group', 'contember_module', 'graphql_operation'],
		buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	})

	const requestSummaryMs = new prom.Histogram({
		name: 'contember_http_duration_ms',
		help: '[DEPRECATED] Incoming HTTP requests statistics by http_method (OPTIONS requests are ignored), http_code, contember_project (or "unknown" for undefined project), contember_project_group (or "unknown" for undefined project group), contember_module (system, tenant, content, unknown) and graphql_operation (query, mutation, unknown)',
		registers: [registry],
		labelNames: ['http_method', 'http_code', 'contember_project', 'contember_project_group', 'contember_module', 'graphql_operation'],
		buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
	})

	return async (ctx, next) => {
		const start = Date.now()
		try {
			await next()
		} finally {
			const labels = {
				http_method: ctx.method,
				http_code: ctx.status,
				contember_project: ctx.state.project || 'unknown',
				contember_project_group: ctx.state.projectGroup || 'unknown',
				contember_module: ctx.state.module || 'unknown',
				graphql_operation: ctx.state.graphql?.operationName || 'unknown',
			}
			if (ctx.method !== 'OPTIONS') {
				requestSummary.observe(labels, (Date.now() - start) / 1000)
				requestSummaryMs.observe(labels, Date.now() - start)
			}
		}
	}
}
