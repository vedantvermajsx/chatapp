const tempAvatar = new Map([
  [0, 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782369805/male_g68rxt.avif'],
  [1, 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782369805/female_qc0qfx.avif'],
  [2, 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782369805/others_xgufdt.avif']
]);

export function getDefaultAvatar(gender) {
  gender = Number(gender) % 3;
  return tempAvatar.get(gender);
}