import Skeleton from "@/components/Skeleton";
export default function Loading(){
  return (
    <div className="container py-10 grid gap-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
