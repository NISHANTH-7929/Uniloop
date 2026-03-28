/**
 * stripReporter.js
 * Middleware utility that removes the reporter field from Complaint
 * documents before sending them in public API responses.
 * Admin routes bypass this and can see reporter.
 */

/**
 * Strip reporter from a single complaint plain object.
 */
export const stripReporter = (doc) => {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    delete obj.reporter;
    delete obj.__reporter; // safety
    return obj;
};

/**
 * Strip reporter from an array of complaint documents.
 */
export const stripReporterArray = (docs) =>
    docs.map(stripReporter);
