/** Extracts one regular expression match from `val`. */
export function find(val: string, regex: RegExp, all?: false): string;

/** Extracts all regular expression matches from `val`. */
export function find(val: string, regex: RegExp, all: true): string[];

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
