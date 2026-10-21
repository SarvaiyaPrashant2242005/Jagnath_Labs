export const getJagnathImage = (filename) => {
  if (!filename) return '';
  const clean = filename.replace(/^.*[\\/]/, '');
  return `/assets/reference_images/${clean}`;
};

export default getJagnathImage;
