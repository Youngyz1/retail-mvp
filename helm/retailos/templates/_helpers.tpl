{{/*
Chart name helper — truncated to 63 chars (K8s label limit).
*/}}
{{- define "retailos.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Full release name — used for resource naming.
*/}}
{{- define "retailos.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "retailos.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "retailos.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels — used in matchLabels & pod template labels.
*/}}
{{- define "retailos.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retailos.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
