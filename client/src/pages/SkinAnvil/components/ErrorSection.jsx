import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert';

const ErrorSection = ({ error }) => {
  if (!error) return null;

  return (
    <section aria-label="Error Messages" className="mt-2 sm:mt-4">
      <h2 className="sr-only">Error Information</h2>
      <Alert variant="destructive" data-testid="error-alert">
        <AlertTitle className="font-minecraft">Error</AlertTitle>
        <AlertDescription className="font-minecraft">{error}</AlertDescription>
      </Alert>
    </section>
  );
};

export default React.memo(ErrorSection);
