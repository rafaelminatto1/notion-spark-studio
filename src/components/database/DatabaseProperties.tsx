
import React, { useState } from 'react';
import type { Database, DatabaseProperty } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Type, Hash, Calendar, CheckSquare, Link, Mail, Phone } from 'lucide-react';

interface DatabasePropertiesProps {
  database: Database;
  onUpdateDatabase: (updates: Partial<Database>) => void;
  onClose: () => void;
}

export const DatabaseProperties: React.FC<DatabasePropertiesProps> = ({
  database,
  onUpdateDatabase,
  onClose
}) => {
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState<DatabaseProperty['type']>('text');

  const propertyIcons = {
    text: Type,
    number: Hash,
    select: CheckSquare,
    multi_select: CheckSquare,
    date: Calendar,
    checkbox: CheckSquare,
    url: Link,
    email: Mail,
    phone: Phone,
    formula: Hash,
    relation: Link,
    rollup: Hash
  };

  const addProperty = () => {
    if (!newPropertyName.trim()) return;

    const newProperty: DatabaseProperty = {
      id: Date.now().toString(),
      name: newPropertyName,
      type: newPropertyType,
      options: newPropertyType === 'select' || newPropertyType === 'multi_select' ? {
        selectOptions: [
          { id: '1', name: 'Opção 1', color: '#3b82f6' },
          { id: '2', name: 'Opção 2', color: '#10b981' },
          { id: '3', name: 'Opção 3', color: '#f59e0b' }
        ]
      } : undefined
    };

    onUpdateDatabase({
      properties: [...database.properties, newProperty]
    });

    setNewPropertyName('');
    setNewPropertyType('text');
  };

  const deleteProperty = (propertyId: string) => {
    const updatedProperties = database.properties.filter(p => p.id !== propertyId);
    
    // Remove property values from all rows
    const updatedRows = database.rows.map(row => {
      const { [propertyId]: removed, ...properties } = row.properties;
      return { ...row, properties };
    });

    onUpdateDatabase({
      properties: updatedProperties,
      rows: updatedRows
    });
  };

  const updateProperty = (propertyId: string, updates: Partial<DatabaseProperty>) => {
    const updatedProperties = database.properties.map(prop =>
      prop.id === propertyId ? { ...prop, ...updates } : prop
    );

    onUpdateDatabase({
      properties: updatedProperties
    });
  };

  return (
    <Card className="mb-6 bg-notion-dark-hover border-notion-dark-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Propriedades do Database</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing Properties */}
          <div className="space-y-2">
            {database.properties.map(property => {
              const Icon = propertyIcons[property.type] || Type;
              
              return (
                <div key={property.id} className="flex items-center gap-3 p-3 rounded bg-notion-dark border border-notion-dark-border">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <Input
                    value={property.name}
                    onChange={(e) => { updateProperty(property.id, { name: e.target.value }); }}
                    className="flex-1"
                  />
                  <Select
                    value={property.type}
                    onValueChange={(type) => 
                      { updateProperty(property.id, { type: type as DatabaseProperty['type'] }); }
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="multi_select">Multi-select</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { deleteProperty(property.id); }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Add New Property */}
          <div className="flex items-center gap-3 p-3 rounded bg-notion-dark border border-notion-dark-border border-dashed">
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={newPropertyName}
                onChange={(e) => { setNewPropertyName(e.target.value); }}
                placeholder="Nome da propriedade"
                className="flex-1"
              />
              <Select value={newPropertyType} onValueChange={(type) => { setNewPropertyType(type as DatabaseProperty['type']); }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="multi_select">Multi-select</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addProperty} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
