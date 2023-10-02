import styled from 'styled-components'

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
  th,
  td {
    line-height: 1.125;
  }
  th:last-child,
  tr > td:last-child {
    text-align: center;
  }
  tr > th {
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
`
export const StackedTd = styled.td`
  font-weight: bold;
  & > span {
    line-height: 1.125;
    font-weight: normal;
    display: block;
  }
`

export default Table
