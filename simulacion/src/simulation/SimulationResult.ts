export interface NodeResult {
    nodeId: string;
    voltage: number;
}

export interface ComponentResult {
    componentId: string;
    type: string;
    voltage: number;
    current: number;
    power: number;
    measurements?: Record<string, number | boolean>;
}

export interface SimulationResult {
    success: boolean;
    nodes: NodeResult[];
    components: ComponentResult[];
    errors: string[];
    /** Automatic component failures detected from the healthy solution and applied for the final result. */
    automaticFailures?: Record<string, string>;
}
