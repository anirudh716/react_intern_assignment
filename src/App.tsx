import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTableSelectionMultipleChangeEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import type { PaginatorPageChangeEvent } from "primereact/paginator";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { OverlayPanel } from "primereact/overlaypanel";
import type { OverlayPanel as OverlayPanelType } from "primereact/overlaypanel";
import axios from "axios";
import "./App.css";

interface Product {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [inputValue, setInputValue] = useState<string>("");

  const overlayRef = useRef<OverlayPanelType>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page + 1}`
      );
      setProducts(response.data.data);
      setTotalRecords(response.data.pagination.total);
    };
    fetchProducts();
  }, [page]);

  const handleSubmit = async () => {
    let numToSelect = parseInt(inputValue, 10);
    if (isNaN(numToSelect) || numToSelect <= 0) return;

    let newSelected = new Set(selectedIds);
    let currentPage = page;
    let rowsLeft = numToSelect;

    while (rowsLeft > 0) {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${currentPage + 1}`
      );
      const pageData: Product[] = response.data.data;
      for (let p of pageData) {
        if (newSelected.size < numToSelect) {
          newSelected.add(p.id);
        } else {
          break;
        }
      }
      rowsLeft = numToSelect - newSelected.size;
      if (rowsLeft > 0) {
        currentPage += 1;
      } else {
        break;
      }
    }

    setSelectedIds(newSelected);
    overlayRef.current?.hide();
  };

  const onSelectionChange = (
    e: DataTableSelectionMultipleChangeEvent<Product[]>
  ) => {
    const newSelected = new Set(selectedIds);

    products.forEach((p) => {
      const isChecked = e.value.some((sel) => sel.id === p.id);
      if (isChecked) {
        newSelected.add(p.id);
      } else {
        newSelected.delete(p.id);
      }
    });

    setSelectedIds(newSelected);
  };

  const selectionHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Button
        icon="pi pi-chevron-down"
        text
        onClick={(e) => overlayRef.current?.toggle(e)}
      />
      <OverlayPanel ref={overlayRef}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <InputText
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Select rows..."
          />
          <Button label="Submit" onClick={handleSubmit} />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div className="main-container">
      <DataTable
        value={products}
        dataKey="id"
        selection={products.filter((p) => selectedIds.has(p.id))}
        onSelectionChange={onSelectionChange}
        tableStyle={{ minWidth: "50rem" }}
        selectionMode={"multiple"}
      >
        <Column
          selectionMode="multiple"
          header={selectionHeader}
          headerStyle={{ width: "12rem" }}
        />
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place of Origin"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Date Start"></Column>
        <Column field="date_end" header="Date End"></Column>
      </DataTable>
      <Paginator
        first={page * 10}
        rows={10}
        totalRecords={totalRecords}
        onPageChange={(e: PaginatorPageChangeEvent) => setPage(e.page)}
      />
    </div>
  );
}

export default App;
