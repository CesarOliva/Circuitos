export class LinearSystemSolver {
    static solve(
        matrix: number[][],
        vector: number[]
    ): number[] {
        const n = vector.length;

        if (
            matrix.length !== n ||
            matrix.some(row => row.length !== n)
        ) {
            throw new Error("Invalid matrix dimensions");
        }

        const A = matrix.map(row => [...row]);
        const b = [...vector];

        const EPS = 1e-12;

        for (let i = 0; i<n; i++) {
            let pivot = i;

            for (let j = i; j < n; j++) {
                if (Math.abs(A[j]![i]!) > Math.abs(A[pivot]![i]!)) {
                    pivot = j;
                }
            }

            if (Math.abs(A[pivot]![i]!) < EPS) {
                throw new Error("Singular matrix: Cannot be solved");
            }

            const currentRow = A[i]!;
            A[i] = A[pivot]!;
            A[pivot] = currentRow;

            const currentValue = b[i]!;
            b[i] = b[pivot]!;
            b[pivot] = currentValue;

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

            for (let j = i + 1; j < n; j++) {
                sum -= A[i]![j]! * x[j]!;
            }

            x[i] = sum / A[i]![i]!;
        }

        if (x.some(value => !Number.isFinite(value))) {
            throw new Error("Invalid numerical solution");
        }

        return x;
    }
}
