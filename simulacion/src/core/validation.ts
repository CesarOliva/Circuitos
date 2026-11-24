export function finite(value: number, label: string): number {
    if (!Number.isFinite(value)) {
        throw new RangeError(`${label} must be finite`);
    }

    return value;
}

export function positive(value: number, label: string): number {
    if (finite(value, label) <= 0){
        throw new RangeError(`${label} must be > 0`);
    }

    return value;
}

export function nonnegative(value: number, label: string): number {
    if (finite(value, label) < 0){
        throw new RangeError(`${label} must be >= 0`);
    }

    return value;
}

export function fraction(value: number, label: string): number {
    if (finite(value, label) < 0 || value > 1) {
        throw new RangeError(`${label} must be between 0 and 1`);
    }
    
    return value;
}