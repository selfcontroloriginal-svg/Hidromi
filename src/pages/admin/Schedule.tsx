import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../../components/Calendar';
import { VisitDialog } from '../../components/VisitDialog';
import { Visit } from '../../store/visits';
import { ArrowLeft } from 'lucide-react';

function Schedule() {
  const navigate = useNavigate();
  const [selectedVisit, setSelectedVisit] = useState<Visit | undefined>();
  const [showVisitDialog, setShowVisitDialog] = useState(false);

  const handleVisitSelect = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowVisitDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          </div>
        </div>

        <Calendar onEventSelect={handleVisitSelect} />

        <VisitDialog
          open={showVisitDialog}
          onOpenChange={setShowVisitDialog}
          visit={selectedVisit}
          mode="view"
        />
      </div>
    </div>
  );
}

export default Schedule;