/** Prikaz avatara — slika ako postoji, inače inicijali. */
export default function Avatar({
  ime,
  slika,
  className = "h-11 w-11 text-sm",
}: {
  ime: string;
  slika?: string | null;
  className?: string;
}) {
  const inicijali = ime
    .split(" ")
    .map((d) => d[0])
    .slice(0, 2)
    .join("");

  if (slika) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slika}
        alt={ime}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${className}`}
    >
      {inicijali}
    </div>
  );
}
