"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { useEffect } from "react";

export default function Error_({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-danger">Something went wrong</h2>
        </CardHeader>
        <CardBody>
          <p className="text-default-500">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </CardBody>
        <CardFooter>
          <Button color="primary" onPress={reset}>
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
