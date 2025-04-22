// Generic fetcher function for useSWR
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    let errorInfo = 'An error occurred while fetching the data.';
    try {
        // Try to get more specific error message from response body
        const errorData = await res.json();
        errorInfo = errorData.error || errorInfo;
    } catch (parseError) {
        // If parsing fails, use the status text
        errorInfo = res.statusText || errorInfo;
    }
    const error = new Error(errorInfo);
    // Attach extra info to the error object.
    // error.info = await res.json(); // Already tried above
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};
