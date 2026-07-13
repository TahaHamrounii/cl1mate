// ----------------------------------------------------------------------

export function useChart(options) {
  const baseOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeout', speed: 400 },
      fontFamily: "'Public Sans', sans-serif",
    },
    colors: ['#22C55E', '#118D57'],
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    fill: {
      opacity: 1,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      strokeDashArray: 3,
      borderColor: '#919EAB1F',
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: "'Public Sans', sans-serif",
          colors: '#919EAB',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: "'Public Sans', sans-serif",
          colors: '#919EAB',
        },
      },
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: {
        formatter: (val) => val,
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: "'Public Sans', sans-serif",
      fontSize: '13px',
      labels: { colors: '#637381' },
      markers: { radius: 12 },
    },
  };

  return Object.assign(baseOptions, options);
}
