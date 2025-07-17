const createSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, "-");
};
export default createSlug;
