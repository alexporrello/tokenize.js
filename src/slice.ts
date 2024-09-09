declare type SliceOptions = {
    lowercase?: boolean;
    offsetStart?: number;
    offsetEnd?: number;
    trim?: boolean;
};

export function slice(
    str: string,
    start: string,
    opts?: SliceOptions & {
        end?: string;
    }
): string;

export function slice(
    str: string,
    start: string,
    end?: string,
    opts?: SliceOptions
): string;

export function slice(
    str: string,
    start: string,
    endOrOpts?: SliceOptions | string,
    opts?: SliceOptions & {
        end?: string;
    }
): string {
    let { end, lowercase, offsetEnd, offsetStart, trim } = ((): SliceOptions & {
        end?: string;
    } => {
        // Signature 1
        if (typeof endOrOpts === 'object') return endOrOpts;
        // Signature 2
        return {
            end: endOrOpts,
            ...(opts ?? {})
        };
    })();

    offsetStart ??= 0;
    offsetEnd ??= 0;
    lowercase ??= true;
    trim ??= true;

    let _str = lowercase ? str.toLowerCase() : str;

    if (end) {
        return str
            .substring(
                _str.indexOf(start) + start.length + offsetStart,
                _str.indexOf(end) + offsetEnd
            )
            .trim();
    } else {
        return str
            .substring(_str.indexOf(start) + start.length + offsetStart)
            .trim();
    }
}

export function find(str: string, regex: RegExp, all?: false): string;
export function find(str: string, regex: RegExp, all: true): string[];
export function find(str: string, regex: RegExp, all = false) {
    if (!all) {
        const matches = str.match(regex);
        if (matches) {
            return matches[0];
        }
        return undefined;
    }

    const matches = str.matchAll(regex);
    const results: string[] = [];
    let result = matches.next();

    while (!result.done) {
        results.push(result.value[0]);
        result = matches.next();
    }

    return results;
}
