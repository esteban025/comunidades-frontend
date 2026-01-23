export const getInitialsNames = (fullName: string): string => {
  const namesArray = fullName.trim().split(" ");
  let initials = "";
  for (let i = 0; i < namesArray.length && i < 2; i++) {
    if (namesArray[i].length > 0) {
      initials += namesArray[i][0].toUpperCase();
    }
  }
  return initials;
}