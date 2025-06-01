import { getReviewAction } from "@/app/reviews/actions";
import { ReviewResults } from "@/components/review/ReviewResult";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDateTimeString } from "@/components/lib/utils";
import { notFound } from "next/navigation";

interface ReviewPageProps {
  params: {
    id: string;
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const result = await getReviewAction(params.id);

  if ("statusCode" in result || !result.review) {
    return notFound();
  }

  const { review } = result;

  return (
    <div className="container py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/reviews">Reviews</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {review.fileName || "Untitled Review"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>{review.fileName || "Untitled Review"}</CardTitle>
          <CardDescription>
            Review created on {getDateTimeString(review.createdAt)} using{" "}
            {review.modelName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {review.results?.length > 0 ? (
            <ReviewResults results={review.results} reviewId={review.id} />
          ) : (
            <p>No review results found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
