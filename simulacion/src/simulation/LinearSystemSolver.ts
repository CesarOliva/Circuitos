export class LinearSystemSolver {
    static solve(matrix: number[][], vector: number[]): number[] {
        const n = vector.length;

        if (matrix.length !== n || matrix.some(row => row.length !== n)) {
            throw new Error("Invalid matrix dimensions");
        }
        if (matrix.some(row => row.some(value => !Number.isFinite(value))) ||
            vector.some(value => !Number.isFinite(value))) {
            throw new Error("Matrix and vector values must be finite");
        }

        const A = matrix.map(row => [...row]);
        const b = [...vector];
        const rowScales = A.map(row => row.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0));
        const EPS = 1e-12;

        for (let i = 0; i < n; i++) {
            let pivot = i;
            for (let j = i + 1; j < n; j++) {
                const ratio = rowScales[j] === 0 ? 0 : Math.abs(A[j]![i]!) / rowScales[j]!;
                const pivotRatio = rowScales[pivot] === 0 ? 0 : Math.abs(A[pivot]![i]!) / rowScales[pivot]!;
                if (ratio > pivotRatio) pivot = j;
            }
            if (rowScales[pivot] === 0 || Math.abs(A[pivot]![i]!) <= EPS * rowScales[pivot]!) {
                throw new Error("Singular matrix: Cannot be solved");
            }

            [A[i], A[pivot]] = [A[pivot]!, A[i]!];
            [b[i], b[pivot]] = [b[pivot]!, b[i]!];
            [rowScales[i], rowScales[pivot]] = [rowScales[pivot]!, rowScales[i]!];

            for (let j = i + 1; j < n; j++) {
                const factor = A[j]![i]! / A[i]![i]!;
                for (let k = i; k < n; k++) {
                    A[j]![k] = A[j]![k]! - factor * A[i]![k]!;
                }
                b[j] = b[j]! - factor * b[i]!;
            }
        }

        const x = new Array<number>(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = b[i]!;
            for (let j = i + 1; j < n; j++) sum -= A[i]![j]! * x[j]!;
            x[i] = sum / A[i]![i]!;
        }
        if (x.some(value => !Number.isFinite(value))) {
            throw new Error("Invalid numerical solution");
        }
        return x;
    }
}