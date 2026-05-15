'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar } from 'lucide-react';

export default function SchedulePage() {
  return (
    <PrivateRoute>
      <DashboardLayout>
        <div className="h-full overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cronograma</h1>
              <p className="text-gray-600 mt-2">Visualize o cronograma de fiscalizações</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Cronograma de Atividades
                </CardTitle>
                <CardDescription>Funcionalidade em desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-600">Esta funcionalidade será implementada em breve</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}
