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
    validateNetwork(nodes, groundId, branches, constraints);
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
            throw new Error("Singular circuit matrix after grounding; check numerical conditioning");
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

function validateNetwork(
    nodes: readonly string[],
    groundId: string,
    branches: readonly ConductanceBranch[],
    constraints: readonly VoltageConstraint[],
): void {
    const nodeSet = new Set(nodes);
    if (!nodeSet.has(groundId)) throw new Error(`Unknown ground node ${groundId}`);
    const adjacency = new Map(nodes.map(node => [node, new Set<string>()]));
    const connect = (a: string, b: string) => {
        const neighborsA = adjacency.get(a);
        const neighborsB = adjacency.get(b);
        if (!neighborsA || !neighborsB) throw new Error(`Unknown node in network edge: ${a}, ${b}`);
        neighborsA.add(b);
        neighborsB.add(a);
    };

    for (const branch of branches) {
        if (!Number.isFinite(branch.conductance) || branch.conductance < 0 ||
            !Number.isFinite(branch.currentOffset ?? 0)) {
            throw new Error(`Invalid model for ${branch.id}`);
        }
        if (branch.conductance > 0) connect(branch.positive, branch.negative);
        else {
            if (!nodeSet.has(branch.positive) || !nodeSet.has(branch.negative)) {
                throw new Error(`Unknown node in branch ${branch.id}`);
            }
        }
    }

    const constraintIds = new Set<string>();
    for (const constraint of constraints) {
        if (!Number.isFinite(constraint.voltage)) throw new Error(`Invalid voltage in ${constraint.id}`);
        if (constraintIds.has(constraint.id)) throw new Error(`Duplicate voltage constraint ${constraint.id}`);
        constraintIds.add(constraint.id);
        connect(constraint.positive, constraint.negative);
    }

    const connected = new Set<string>([groundId]);
    const pending = [groundId];
    while (pending.length) {
        const node = pending.pop()!;
        for (const neighbor of adjacency.get(node)!) {
            if (connected.has(neighbor)) continue;
            connected.add(neighbor);
            pending.push(neighbor);
        }
    }
    const floating = nodes.filter(node => !connected.has(node));
    if (floating.length) throw new Error(`Floating nodes: ${floating.join(", ")}`);

    const voltageEdges = new Map(nodes.map(node => [node, [] as Array<{ node: string; difference: number }>]));
    const parent = new Map(nodes.map(node => [node, node]));
    const find = (node: string): string => {
        const root = parent.get(node);
        if (root === undefined) throw new Error(`Unknown node ${node}`);
        if (root === node) return node;
        const representative = find(root);
        parent.set(node, representative);
        return representative;
    };
    let redundantConstraint = false;
    for (const constraint of constraints) {
        const { positive, negative, voltage } = constraint;
        if (positive === negative) {
            if (voltage !== 0) throw new Error(`Conflicting ideal voltage sources at node ${positive}`);
            redundantConstraint = true;
            continue;
        }
        const rootPositive = find(positive);
        const rootNegative = find(negative);
        if (rootPositive === rootNegative) redundantConstraint = true;
        else parent.set(rootPositive, rootNegative);
        voltageEdges.get(negative)!.push({ node: positive, difference: voltage });
        voltageEdges.get(positive)!.push({ node: negative, difference: -voltage });
    }

    const potentials = new Map<string, number>();
    for (const start of nodes) {
        if (potentials.has(start)) continue;
        potentials.set(start, 0);
        const queue = [start];
        while (queue.length) {
            const node = queue.pop()!;
            const value = potentials.get(node)!;
            for (const edge of voltageEdges.get(node)!) {
                const expected = value + edge.difference;
                const current = potentials.get(edge.node);
                if (current === undefined) {
                    potentials.set(edge.node, expected);
                    queue.push(edge.node);
                } else if (Math.abs(current - expected) > 1e-9 * Math.max(1, Math.abs(current), Math.abs(expected))) {
                    throw new Error(`Conflicting ideal voltage sources near node ${edge.node}`);
                }
            }
        }
    }
    if (redundantConstraint) {
        throw new Error("Redundant ideal voltage constraints; current sharing is indeterminate");
    }
}
