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
}

export interface SimulationResult {
    success: boolean;
    nodes: NodeResult[];
    components: ComponentResult[];
    errors: string[];
}