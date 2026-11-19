import { LinearSystemSolver } from "./LinearSystemSolver.ts";

export interface ConductanceBranch {
    id: string;
    positive: string;
    negative: string;
    conductance: number;
    currentOffset?: number;
}

export interface VoltageConstraint {
    id: string;
    positive: string;
    negative: string;
    voltage: number;
}

export interface NetworkSolution {
    voltage(nodeId: string): number;
    voltageSourceCurrent(id: string): number;
    branchCurrent(branch: ConductanceBranch): number;
}

export function solveNetwork(
    nodes: readonly string[],
    groundId: string,
    branches: readonly ConductanceBranch[],
    constraints: readonly VoltageConstraint[],
): NetworkSolution {
    const unknownNodes = nodes.filter(id => id !== groundId);
    const nodeIndex = new Map(unknownNodes.map((id, index) => [id, index]));
    const sourceIndex = new Map(constraints.map((source, index) => [source.id, unknownNodes.length + index]));
    const size = unknownNodes.length + constraints.length;
    const matrix = Array.from({ length: size }, () => Array<number>(size).fill(0));
    const vector = Array<number>(size).fill(0);
    const indexOf = (id: string): number => {
        if (id === groundId) return -1;
        const index = nodeIndex.get(id);
        if (index === undefined) throw new Error(`Unknown node ${id}`);
        return index;
    };

    for (const branch of branches) {
        const p = indexOf(branch.positive);
        const n = indexOf(branch.negative);
        const g = branch.conductance;
        const offset = branch.currentOffset ?? 0;
        if (!Number.isFinite(g) || g < 0 || !Number.isFinite(offset)) {
            throw new Error(`Invalid model for ${branch.id}`);
        }
        if (p >= 0) {
            matrix[p]![p] = matrix[p]![p]! + g;
            vector[p] = vector[p]! - offset;
        }
        if (n >= 0) {
            matrix[n]![n] = matrix[n]![n]! + g;
            vector[n] = vector[n]! + offset;
        }
        if (p >= 0 && n >= 0) {
            matrix[p]![n] = matrix[p]![n]! - g;
            matrix[n]![p] = matrix[n]![p]! - g;
        }
    }

    for (const source of constraints) {
        const p = indexOf(source.positive);
        const n = indexOf(source.negative);
        const row = sourceIndex.get(source.id)!;
        if (!Number.isFinite(source.voltage)) throw new Error(`Invalid voltage in ${source.id}`);
        if (p >= 0) {
            matrix[p]![row] = matrix[p]![row]! + 1;
            matrix[row]![p] = matrix[row]![p]! + 1;
        }
        if (n >= 0) {
            matrix[n]![row] = matrix[n]![row]! - 1;
            matrix[row]![n] = matrix[row]![n]! - 1;
        }
        vector[row] = source.voltage;
    }

    let values: number[];
    try {
        values = LinearSystemSolver.solve(matrix, vector);
    } catch (error) {
        if (error instanceof Error && error.message.includes("Singular matrix")) {
            throw new Error("Singular circuit matrix; check for floating nodes or conflicting ideal voltage sources");
        }
        throw error;
    }
    const voltage = (id: string): number => {
        if (id === groundId) return 0;
        const index = nodeIndex.get(id);
        if (index === undefined) throw new Error(`Unknown node ${id}`);
        return values[index]!;
    };

    return {
        voltage,
        voltageSourceCurrent: id => {
            const index = sourceIndex.get(id);
            if (index === undefined) throw new Error(`Unknown voltage source ${id}`);
            return values[index]!;
        },
        branchCurrent: branch => branch.conductance * (voltage(branch.positive) - voltage(branch.negative)) + (branch.currentOffset ?? 0),
    };
}